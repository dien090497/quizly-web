'use client';

import {useCallback, useEffect, useState} from 'react';
import {SOCKETS} from '../lib/config';
import {fetchRoomView} from '../lib/api';
import {loadRoomCredentials, saveRoomCredentials} from '../lib/session';
import type {RoomCredentials, RoomView} from '../lib/types';

export function useRoom() {
    const [room, setRoom] = useState<RoomCredentials | null>(null);
    const [roomView, setRoomView] = useState<RoomView | null>(null);
    const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

    // Restore from sessionStorage on mount
    useEffect(() => {
        const saved = loadRoomCredentials();
        if (saved) setRoom(saved);
    }, []);

    const persistRoom = useCallback((next: RoomCredentials | null) => {
        saveRoomCredentials(next);
        setRoom(next);
        setRoomView(null);
    }, []);

    const leaveRoom = useCallback(() => persistRoom(null), [persistRoom]);

    // WebSocket + polling
    useEffect(() => {
        if (!room) {
            setRoomView(null);
            return;
        }

        const refresh = async () => {
            try {
                const view = await fetchRoomView(room.pin, room.playerToken);
                setRoomView(view);
            } catch (err: unknown) {
                const status = (err as { status?: number }).status;
                if (status === 401 || status === 404) {
                    leaveRoom();
                }
            }
        };

        void refresh();
        const pollInterval = window.setInterval(() => {
            void refresh();
        }, 10000);

        let socket: WebSocket | null = null;
        let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
        let reconnectDelay = 500;
        let stopped = false;

        const connect = () => {
            if (stopped) return;
            try {
                socket = new WebSocket(`${SOCKETS}/ws/rooms/${room.pin}`);
                socket.onopen = () => {
                    reconnectDelay = 500;
                    void refresh();
                };
                socket.onmessage = () => {
                    void refresh();
                };
                socket.onclose = () => {
                    if (stopped) return;
                    reconnectTimer = setTimeout(connect, reconnectDelay);
                    reconnectDelay = Math.min(reconnectDelay * 2, 10000);
                };
                socket.onerror = () => socket?.close();
            } catch {
                reconnectTimer = setTimeout(connect, reconnectDelay);
                reconnectDelay = Math.min(reconnectDelay * 2, 10000);
            }
        };

        connect();
        return () => {
            stopped = true;
            clearInterval(pollInterval);
            if (reconnectTimer) clearTimeout(reconnectTimer);
            socket?.close();
        };
    }, [room?.pin, room?.playerToken, leaveRoom]);

    // Countdown timer
    useEffect(() => {
        const deadline = roomView?.phase === 'QUESTION' ? roomView.questionEndsAtMillis : 0;
        if (!deadline) {
            setSecondsLeft(null);
            return;
        }
        const update = () => setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
        update();
        const interval = setInterval(update, 150);
        return () => clearInterval(interval);
    }, [roomView?.questionEndsAtMillis, roomView?.phase]);

    return {room, roomView, setRoomView, secondsLeft, persistRoom, leaveRoom};
}
