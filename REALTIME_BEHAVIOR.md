# Real-Time Update Behavior by Mode

## 📊 Visual Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        NEW IMAGE UPLOADED                        │
│              (via Web Upload or Desktop Sync)                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │  SSE Broadcast to All Tabs   │
              └──────────────┬───────────────┘
                             │
                  ┌──────────┴──────────┐
                  │                     │
                  ▼                     ▼
         ┌────────────────┐    ┌────────────────────┐
         │  SINGLE MODE   │    │  COLLECTION MODE   │
         │    Gallery     │    │      Gallery       │
         └────────┬───────┘    └─────────┬──────────┘
                  │                       │
                  ▼                       ▼
         ┌────────────────┐    ┌─────────────────────────────┐
         │ ✅ REAL-TIME   │    │ ✅ REAL-TIME                │
         │                │    │                             │
         │ New image      │    │ New image appears in:       │
         │ appears in     │    │ • Selection buffer          │
         │ main gallery   │    │ • "New Collection" pool     │
         │ instantly      │    │                             │
         │                │    │ For user to select & save   │
         └────────────────┘    └─────────────────────────────┘
```

---

## 📋 Detailed Behavior Table

| Event Type | Single Mode | Collection Mode Buffer | Collection Mode Main |
|------------|-------------|------------------------|----------------------|
| **New Image Uploaded** | ✅ Appears instantly in gallery | ✅ Appears instantly in selection pool | ❌ Not applicable (shows collections, not images) |
| **Image Updated** | ✅ Updates in place | ✅ Updates in selection pool | ❌ N/A |
| **Image Deleted** | ✅ Removed instantly | ✅ Removed from selection pool | ❌ N/A |
| **Collection Saved** | ❌ N/A (single mode has no collections) | ❌ Manual refresh needed* | ✅ Appears after user saves (via manual action) |

\* *In collection mode, when user saves a collection, the page refreshes to show the new collection. This is intentional as it's a user-initiated action, not a real-time sync event.*

---

## 🎯 User Experience by Mode

### Single Mode (Photographer Workflow)

**Scenario:** Event photographer shooting live event

1. 📸 Photographer takes photo on camera
2. 🔄 Desktop sync detects new file (FSEvents)
3. ⬆️ Uploads to Supabase automatically
4. 📡 SSE broadcasts to all connected browsers
5. ✨ **Image appears on client's screen instantly** (no refresh needed)
6. 👀 Client sees photo within 2-3 seconds of capture

**Why it matters:** Client can see photos in real-time during the event, making the experience interactive and engaging.

---

### Collection Mode (Multi-Shot Sessions)

**Scenario:** Portrait photographer shooting multiple looks

#### Buffer Gallery (Selection Pool)

1. 📸 Photographer shoots 20 photos of "Look 1"
2. 🔄 Desktop sync uploads all 20 photos
3. ✨ **Each photo appears in selection pool as it uploads** (real-time)
4. 👔 Photographer immediately selects best 5 photos
5. 💾 Clicks "Save Collection" → Creates "Collection #1"
6. 🔄 Page refreshes, Collection #1 appears in main gallery

#### Main Gallery (Finalized Collections)

1. 📚 Shows only saved collections (Collection #1, #2, #3, etc.)
2. ❌ **Does NOT auto-update** when new images arrive
3. ✅ **Only updates** when photographer explicitly saves a collection
4. 🎯 Clean, curated view of finalized work

**Why it matters:** 
- Buffer gets real-time images for quick selection
- Main gallery stays clean, only showing intentionally saved collections
- No confusion between "work in progress" and "finalized"

---

## 🔧 Technical Implementation

### Code Flow for New Image

```typescript
// 1. Image uploaded (web or desktop sync)
POST /api/projects/[projectId]/upload
  └─> broadcastToProject(projectId, { type: 'new_image', data: {...} })

// 2. SSE broadcasts to all tabs
GET /api/projects/[projectId]/events (SSE connection)
  └─> Sends event to all connected clients

// 3. ImageGallery receives event
useRealTimeUpdates({ 
  onNewImage: handleNewImage  // ← Callback triggered
})

// 4. Incremental update (no flash!)
handleNewImage(imageData) {
  // Fetch ONLY the new image (not all images)
  const newImage = await fetch(`/images/${imageData.id}`)
  
  // Prepend to state without triggering loading
  setImages(current => [newImage, ...current])
  
  // Result: New image appears at top, no visual disruption
}
```

### What Makes It Flash-Free

❌ **Bad (causes flash):**
```typescript
onNewImage: () => {
  setLoading(true);           // Gallery shows spinner
  fetchImages();              // Fetches ALL images
  setLoading(false);          // Gallery re-renders completely
  // Result: Visual flash, jarring experience
}
```

✅ **Good (seamless):**
```typescript
onNewImage: async (data) => {
  const single = await fetch(`/images/${data.id}`);  // Fetch ONLY new image
  setImages(curr => [single, ...curr]);              // Prepend without loading state
  // Result: Smooth append, no visual disruption
}
```

---

## 🧪 Expected Behaviors

### ✅ What You Should See

**Single Mode:**
- Upload image → Appears in gallery within 2 seconds
- No loading spinner
- No page reload
- Image appears at top
- Green "Live" indicator in corner

**Collection Mode Buffer:**
- Upload image → Appears in selection pool within 2 seconds
- Can immediately click to select it
- No flash or reload
- Image available for adding to new collection

**Collection Mode Main:**
- Shows only saved collections
- Does NOT update when new images arrive
- Only updates when you click "Save Collection"
- This is intentional!

### ❌ What You Should NOT See

- ❌ Page reload or refresh
- ❌ Loading spinner when new image arrives
- ❌ Entire gallery disappearing and reappearing
- ❌ Visual "flash" or "jump"
- ❌ Duplicate images
- ❌ New collections appearing automatically (they're user-created only)

---

## 💡 Key Design Decisions

### Why Collection Mode Has Real-Time for Images but Not Collections?

**Images (Real-time):**
- Automatically uploaded by camera/desktop sync
- User wants to see them immediately for selection
- High frequency (dozens per minute during shoot)
- Asynchronous source (external device)

**Collections (Manual):**
- Created by user clicking "Save Collection"
- User-initiated action, not external event
- Low frequency (a few per session)
- Synchronous source (user's own browser)

**Conclusion:** Images need real-time sync, collections don't (and shouldn't have it).

---

## 🎬 User Stories

### Story 1: Wedding Photographer

**Setup:** Single Mode project for wedding ceremony

1. Photographer shoots ceremony photos
2. Wedding coordinator has iPad showing gallery
3. As photos are taken, they appear on iPad instantly
4. Guests gather around iPad to see photos in real-time
5. Creates excitement and engagement during event

**Real-time updates = Critical for this workflow ✅**

---

### Story 2: Portrait Studio

**Setup:** Collection Mode project for family portraits

1. Photographer shoots 50 photos across 3 different poses
2. Photos upload to buffer in real-time (selection pool)
3. Photographer selects best 10 from pose 1 → Saves as "Collection #1 - Formal"
4. Selects best 8 from pose 2 → Saves as "Collection #2 - Casual"
5. Client views main gallery, sees only the 2 curated collections
6. Client doesn't see all 50 raw images (buffer is for photographer only)

**Real-time for buffer, manual save for collections = Perfect workflow ✅**

---

## 🔍 Debugging Tips

### Check If Real-Time Is Working

**Browser Console:**
```javascript
// Should see these on page load:
✅ Real-time connection established for single mode gallery
🔗 SSE connection opened for project: [uuid]

// Should see these when image uploaded:
🎯 Real-time: New image received (single mode) {...}
✅ Adding image to main gallery (single fetch, no flash!)
```

**Visual Indicators:**
- Green "Live" dot in top-right corner
- New images appear without reload
- No loading spinner when image arrives

### Not Working? Check:

1. **Is SSE connected?** → Look for green "Live" indicator
2. **Is broadcast being called?** → Check upload API logs for "📡 Broadcasted"
3. **Is gallery listening?** → Check for "✅ Real-time connection established"
4. **Right mode?** → Collection mode shows images in buffer, not main gallery

---

## 📚 Summary

| Mode | Real-Time Scope | Why |
|------|----------------|-----|
| **Single** | Images appear in main gallery | Direct display of uploaded photos |
| **Collection Buffer** | Images appear in selection pool | For quick selection into collections |
| **Collection Main** | Only manual collection saves | User-curated, intentional content only |

**Bottom line:** Real-time updates are scoped to where they make sense for the workflow, avoiding confusion and maintaining clean UX! 🎯

