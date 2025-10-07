import { NextRequest } from 'next/server';

// Simple in-memory store for SSE connections
const connections = new Map<string, Set<ReadableStreamDefaultController>>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  
  console.log('🔗 SSE request received for project:', projectId);
  console.log('🔗 Request URL:', request.url);
  console.log('🔗 Request headers:', Object.fromEntries(request.headers.entries()));
  
  if (!projectId) {
    console.error('❌ SSE request failed: Project ID required');
    return new Response('Project ID required', { status: 400 });
  }
  
  // Validate project ID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(projectId)) {
    console.error('❌ SSE request failed: Invalid project ID format:', projectId);
    return new Response('Invalid project ID format', { status: 400 });
  }

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      try {
        console.log(`🔗 Starting SSE stream for project ${projectId}`);
        
        // Add this connection to the project's connections
        if (!connections.has(projectId)) {
          connections.set(projectId, new Set());
        }
        connections.get(projectId)!.add(controller);

        console.log(`🔗 SSE connection established for project ${projectId}. Total connections: ${connections.get(projectId)!.size}`);

        // Send initial connection message
        const initialMessage = `data: ${JSON.stringify({ type: 'connected', message: 'Connected to real-time updates' })}\n\n`;
        controller.enqueue(new TextEncoder().encode(initialMessage));
        console.log('✅ Initial connection message sent');
      } catch (error) {
        console.error('❌ Error in SSE stream start:', error);
        try {
          controller.close();
        } catch (closeError) {
          console.error('❌ Error closing controller:', closeError);
        }
      }

      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          // Check if controller is still open before sending
          if (controller.desiredSize !== null) {
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`)
            );
          } else {
            // Controller is closed, clean up
            console.log(`💔 Heartbeat detected closed connection for project ${projectId}`);
            clearInterval(heartbeat);
            connections.get(projectId)?.delete(controller);
          }
        } catch (error) {
          // Connection closed, stop heartbeat
          console.log(`💔 Heartbeat error, removing connection for project ${projectId}:`, error);
          clearInterval(heartbeat);
          connections.get(projectId)?.delete(controller);
        }
      }, 30000);

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        console.log(`🔌 Client disconnected from SSE stream for project ${projectId}`);
        connections.get(projectId)?.delete(controller);
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch (error) {
          // Controller might already be closed
        }
      });
    },
    
    cancel() {
      console.log(`❌ SSE stream cancelled for project ${projectId}`);
      // Note: We can't access the controller here, but it's already removed in the abort handler
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

// Function to broadcast events to all connections for a project
export function broadcastToProject(projectId: string, event: Record<string, unknown>) {
  const projectConnections = connections.get(projectId);
  console.log(`📡 Broadcasting to project ${projectId}:`, event);
  console.log(`📡 Active connections: ${projectConnections?.size || 0}`);
  console.log(`📡 All project connections:`, Array.from(connections.keys()));
  console.log(`📡 Connection details for ${projectId}:`, {
    hasConnections: !!projectConnections,
    size: projectConnections?.size,
    connections: projectConnections ? Array.from(projectConnections) : null
  });
  
  if (!projectConnections || projectConnections.size === 0) {
    console.log('❌ No connections found for project:', projectId);
    return;
  }

  const eventData = `data: ${JSON.stringify(event)}\n\n`;
  const encoder = new TextEncoder();
  
  // Create a copy of the set to avoid modification during iteration
  const controllersToCheck = Array.from(projectConnections);
  console.log(`📡 Attempting to send to ${controllersToCheck.length} controllers`);
  
  for (const controller of controllersToCheck) {
    try {
      // Check if controller is still open before sending
      if (controller.desiredSize !== null) {
        controller.enqueue(encoder.encode(eventData));
        console.log('✅ Event sent to client');
      } else {
        // Controller is closed, remove it
        projectConnections.delete(controller);
        console.log('❌ Removed closed connection');
      }
    } catch (error) {
      // Remove dead connections
      projectConnections.delete(controller);
      console.log('❌ Removed dead connection:', error);
    }
  }
}
