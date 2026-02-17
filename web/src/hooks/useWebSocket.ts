import { useEffect, useRef, useCallback } from 'react';
import type { WSMessage, ControlEvent, FSMTransitionEvent, PlaybackStartedEvent, PlaybackEndedEvent } from '@shared/types';
import { WS_PATH, WS_RECONNECT_BASE_MS, WS_RECONNECT_MAX_MS, SERVER_PORT } from '@shared/constants';
import { useAppStore } from '../stores/appStore';
import { useOverlayStore } from '../stores/overlayStore';
import { useLogStore } from '../stores/logStore';

type TransitionHandler = (event: FSMTransitionEvent) => void;

export function useWebSocket(onTransition?: TransitionHandler) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTransitionRef = useRef(onTransition);
  const mountedRef = useRef(true);

  useEffect(() => { onTransitionRef.current = onTransition; }, [onTransition]);

  // Use refs to access store actions so connect/handleMessage stay stable
  const handleMessage = useCallback((event: MessageEvent) => {
    let msg: WSMessage;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }

    useLogStore.getState().addEntry(msg, 'inbound');

    switch (msg.type) {
      case 'status':
        useAppStore.getState().applyStatus(msg);
        break;
      case 'fsm.transition':
        useAppStore.getState().setTransition(msg.from, msg.to);
        onTransitionRef.current?.(msg);
        break;
      case 'playback.started':
        useAppStore.getState().setCurrentClip(msg.clip);
        break;
      case 'playback.ended':
        break;
      case 'error':
        useAppStore.getState().setLastError(msg.message);
        break;
      case 'overlay.applied':
        break;
      case 'overlay.subtitle.set':
        useOverlayStore.getState().setSubtitle(msg.text, msg.ttlMs);
        break;
      case 'overlay.subtitle.clear':
        useOverlayStore.getState().clearSubtitle();
        break;
      case 'overlay.card.show':
        useOverlayStore.getState().showCard(
          { id: msg.id, title: msg.title, subtitle: msg.subtitle, imageUrl: msg.imageUrl, price: msg.price, cta: msg.cta, position: msg.position },
          msg.ttlMs,
        );
        break;
      case 'overlay.card.hide':
        useOverlayStore.getState().hideCard(msg.id);
        break;
      case 'overlay.clearAll':
        useOverlayStore.getState().clearAll();
        break;
      case 'overlay.qr.show':
        useOverlayStore.getState().showQR(msg.url, msg.ttlMs);
        break;
      case 'overlay.qr.hide':
        useOverlayStore.getState().hideQR();
        break;
    }
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.DEV
      ? `${window.location.hostname}:${SERVER_PORT}`
      : window.location.host;
    const url = `${protocol}//${host}${WS_PATH}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttemptRef.current = 0;
      useAppStore.getState().setWsConnected(true);
      console.log('[ws] connected');
    };

    ws.onmessage = handleMessage;

    ws.onclose = () => {
      useAppStore.getState().setWsConnected(false);
      console.log('[ws] disconnected');
      if (mountedRef.current) {
        const attempt = reconnectAttemptRef.current;
        const delay = Math.min(
          WS_RECONNECT_BASE_MS * Math.pow(2, attempt),
          WS_RECONNECT_MAX_MS,
        );
        reconnectAttemptRef.current = attempt + 1;
        console.log(`[ws] reconnecting in ${delay}ms (attempt ${attempt + 1})`);
        reconnectTimerRef.current = setTimeout(connect, delay);
      }
    };

    ws.onerror = () => {};
  }, [handleMessage]);

  const send = useCallback((event: ControlEvent | PlaybackStartedEvent | PlaybackEndedEvent) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event));
      useLogStore.getState().addEntry(event, 'outbound');
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);

  return { send };
}
