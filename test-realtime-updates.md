# Quick Real-Time Updates Test Guide

## 🚀 Fast Testing Steps (5 minutes)

### Setup
```bash
# 1. Start your development server
npm run dev

# 2. Open two browser windows/tabs
# Window 1: http://localhost:3000/project/[your-project-id]
# Window 2: http://localhost:3000/project/[your-project-id]
```

### Test Sequence

#### ✅ Test 1: Web Upload (30 seconds)
1. **In Window 1:** Upload an image via the web interface
2. **Watch Window 2:** Image should appear within 1-2 seconds
3. **Expected behavior:**
   - ✅ No page reload
   - ✅ No loading spinner
   - ✅ No "flash" or disappearing images
   - ✅ New image appears at the top smoothly
   - ✅ Green "Live" indicator visible in top-right

#### ✅ Test 2: Desktop Sync (30 seconds)
1. **Start desktop sync:** `cd fotoflo-desktop-sync && npm start`
2. **Configure a project** if not already done
3. **Drop an image** into the watched folder
4. **Watch browser:** Image should appear within 2-3 seconds
5. **Expected behavior:**
   - ✅ Same seamless behavior as web upload
   - ✅ No flash, no reload

#### ✅ Test 3: Multiple Rapid Uploads (1 minute)
1. **Upload 5 images** rapidly (via web or desktop sync)
2. **Expected behavior:**
   - ✅ Each image appears individually as it processes
   - ✅ No duplicates
   - ✅ Gallery doesn't "jump" or flash
   - ✅ All images appear at the top in order

#### ✅ Test 4: Console Verification (30 seconds)
1. **Open DevTools Console** (F12)
2. **Look for these logs:**
   ```
   ✅ Real-time connection established for gallery
   🔗 SSE connection opened for project: [uuid]
   ```
3. **Upload an image**
4. **Look for these logs:**
   ```
   🎯 Real-time: New image received {id: "...", path: "..."}
   ✅ Fetched new image with signed URL (single fetch, no flash!)
   📡 Broadcasted new image event to project: [uuid]
   ```

### 🎯 Success Criteria

| Test | Pass Criteria | Status |
|------|--------------|--------|
| Web upload appears in other tabs | Within 2 seconds, no flash | ⬜ |
| Desktop sync appears in browser | Within 3 seconds, seamless | ⬜ |
| Multiple rapid uploads | All appear individually, no jumps | ⬜ |
| "Live" indicator visible | Green dot + "Live" text | ⬜ |
| Console shows correct logs | SSE events logged properly | ⬜ |
| No duplicates | Same image doesn't appear twice | ⬜ |

### ❌ Failure Indicators

If you see any of these, something is wrong:

- ❌ Gallery shows loading spinner when new image arrives
- ❌ Entire gallery disappears and reappears ("flash")
- ❌ Page reloads automatically
- ❌ Same image appears multiple times
- ❌ New image doesn't appear at all
- ❌ Console shows errors like "SSE connection error"

---

## 🐛 Troubleshooting

### Issue: No "Live" indicator appears
**Cause:** SSE connection not established

**Fix:**
1. Check browser console for errors
2. Verify project ID is valid UUID
3. Check `/api/projects/[projectId]/events` endpoint is accessible
4. Try refreshing the page

### Issue: Images don't appear in real-time
**Cause:** Broadcasting not working or hook not integrated

**Fix:**
1. Check console for "Broadcasted new image event" log
2. Verify `useRealTimeUpdates` hook is called
3. Check network tab for SSE connection (EventStream)
4. Verify projectId matches between upload and gallery

### Issue: Gallery still flashes/reloads
**Cause:** Using old `fetchImages()` instead of incremental update

**Fix:**
1. Verify `handleNewImage` is using single-image fetch endpoint
2. Check that state update uses `[newImage, ...current]`
3. Ensure `setLoading(true)` is NOT called on new image event

### Issue: Duplicates appear
**Cause:** Race condition or missing duplicate check

**Fix:**
1. Verify duplicate check: `images.some(img => img.id === newImageId)`
2. Check that both checks are in place (before fetch and before setState)
3. Clear browser cache and reload

---

## 🔬 Advanced Testing (Optional)

### Load Test: 50 Rapid Uploads
```bash
# In fotoflo-desktop-sync directory
for i in {1..50}; do
  cp test-image.jpg watched-folder/test-$i.jpg
  sleep 0.1
done
```

**Expected:** All 50 images appear smoothly without gallery breaking

### Network Interruption Test
1. Open DevTools → Network tab
2. Enable "Offline" mode
3. Wait 5 seconds
4. Disable "Offline" mode
5. **Expected:** "Live" indicator reappears within 2 seconds

### Multi-User Test (Real Scenario)
1. **Photographer:** Uses desktop sync to upload from camera
2. **Client:** Views gallery on tablet/phone
3. **Admin:** Views gallery on desktop browser
4. **Expected:** All three see new images appear instantly

---

## 📊 Performance Metrics

Use browser DevTools Performance tab to measure:

| Metric | Target | Actual |
|--------|--------|--------|
| Time to first image appearance | < 2s | ___ |
| Network payload for new image | < 100KB | ___ |
| Gallery re-render time | < 50ms | ___ |
| Memory increase per 100 images | < 10MB | ___ |

---

## ✅ Final Checklist

Before marking as complete, verify:

- [ ] Web uploads broadcast SSE events (check console)
- [ ] Desktop sync uploads broadcast SSE events
- [ ] Gallery integrates `useRealTimeUpdates` hook
- [ ] New images appear without full refetch
- [ ] Single-image fetch endpoint works (`/images/[imageId]`)
- [ ] No visual flash when images appear
- [ ] "Live" indicator shows connection status
- [ ] No duplicate images appear
- [ ] Multiple rapid uploads handled smoothly
- [ ] Console logs show correct event flow

**If all checked, real-time updates are working perfectly! 🎉**

