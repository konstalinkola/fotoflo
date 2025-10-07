import { useEffect, useRef, useState, useCallback } from 'react';

interface RealTimeEvent {
  type: 'new_image' | 'image_updated' | 'image_deleted' | 'connected' | 'heartbeat';
  data?: Record<string, unknown>;
  message?: string;
  timestamp?: number;
}

interface UseRealTimeUpdatesOptions {
  projectId: string;
  onNewImage?: (imageData: Record<string, unknown>) => void;
  onImageUpdated?: (imageData: Record<string, unknown>) => void;
  onImageDeleted?: (imageData: Record<string, unknown>) => void;
  onConnected?: () => void;
  onError?: (error: Event) => void;
}

export function useRealTimeUpdates({
  projectId,
  onNewImage,
  onImageUpdated,
  onImageDeleted,
  onConnected,
  onError
}: UseRealTimeUpdatesOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealTimeEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackPollingRef = useRef<NodeJS.Timeout | null>(null);
  const useFallbackRef = useRef(false);

  // Fallback polling function
  const startFallbackPolling = useCallback(() => {
    console.log('🔄 Starting fallback polling for project:', projectId);
    setIsConnected(true);
    
    const poll = async () => {
      try {
        // Poll for updates every 5 seconds
        const response = await fetch(`/api/projects/${projectId}/latest`);
        if (response.ok) {
          const data = await response.json();
          // You could emit a heartbeat event here if needed
          setLastEvent({ type: 'heartbeat', timestamp: Date.now() });
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };
    
    // Start polling immediately and then every 5 seconds
    poll();
    fallbackPollingRef.current = setInterval(poll, 5000);
  }, [projectId]);

  // Store callback refs to avoid recreating connections
  const onNewImageRef = useRef(onNewImage);
  const onImageUpdatedRef = useRef(onImageUpdated);
  const onImageDeletedRef = useRef(onImageDeleted);
  const onConnectedRef = useRef(onConnected);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onNewImageRef.current = onNewImage;
    onImageUpdatedRef.current = onImageUpdated;
    onImageDeletedRef.current = onImageDeleted;
    onConnectedRef.current = onConnected;
    onErrorRef.current = onError;
  }, [onNewImage, onImageUpdated, onImageDeleted, onConnected, onError]);

  useEffect(() => {
    if (!projectId) return;

    console.log('🔄 Setting up SSE connection for project:', projectId);

    const connect = () => {
      // Validate project ID
      if (!projectId) {
        console.error('❌ Cannot establish SSE connection: projectId is empty');
        return;
      }
      
      // Validate project ID format (should be a UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(projectId)) {
        console.error('❌ Cannot establish SSE connection: projectId is not a valid UUID:', projectId);
        return;
      }

      // Close existing connection if any
      if (eventSourceRef.current) {
        console.log('🔌 Closing existing SSE connection for project:', projectId);
        eventSourceRef.current.close();
      }

      console.log('🔗 Establishing new SSE connection for project:', projectId);
      const sseUrl = `/api/projects/${projectId}/events`;
      console.log('🔗 SSE URL:', sseUrl);
      const eventSource = new EventSource(sseUrl, {
        withCredentials: false
      });
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('🔗 Real-time connection opened for project:', projectId);
        setIsConnected(true);
        onConnectedRef.current?.();
        
        // Reset fallback flag when connection is successful
        useFallbackRef.current = false;
      };

      eventSource.onmessage = (event) => {
        try {
          const data: RealTimeEvent = JSON.parse(event.data);
          setLastEvent(data);

          switch (data.type) {
            case 'new_image':
              console.log('New image received:', data.data);
              if (data.data) {
                onNewImageRef.current?.(data.data);
              }
              break;
            case 'image_updated':
              console.log('Image updated:', data.data);
              if (data.data) {
                onImageUpdatedRef.current?.(data.data);
              }
              break;
            case 'image_deleted':
              console.log('Image deleted:', data.data);
              if (data.data) {
                onImageDeletedRef.current?.(data.data);
              }
              break;
            case 'connected':
              console.log('Server confirmed connection');
              break;
            case 'heartbeat':
              // Just keep connection alive, no action needed
              break;
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ SSE connection error for project', projectId, ':', {
          error,
          readyState: eventSource.readyState,
          url: eventSource.url,
          withCredentials: eventSource.withCredentials
        });
        
        // Log more detailed error information
        console.error('SSE Error Details:', {
          type: error.type,
          target: error.target,
          isTrusted: error.isTrusted,
          timeStamp: error.timeStamp
        });
        
        setIsConnected(false);
        onErrorRef.current?.(error);

        // Don't reconnect immediately on first error - wait a bit
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        // Use shorter reconnection delay
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect to SSE for project:', projectId);
          connect();
        }, 2000);
      };
    };

    // Connect immediately - no delay needed
    connect();

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up SSE connection for project:', projectId);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (fallbackPollingRef.current) {
        clearInterval(fallbackPollingRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [projectId, startFallbackPolling]);

  return {
    isConnected,
    lastEvent,
    reconnect: () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      // The useEffect will automatically reconnect
    }
  };
}
