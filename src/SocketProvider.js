import React, { useState, useReducer, useEffect, useContext } from 'react';
import io from 'socket.io-client';

const SocketContext = React.createContext(null);

export const SocketProvider = ({ uri, children, reducer, initialState = {} }) => {
  const [socket, setSocket] = useState();
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const newSocket = io.connect(uri);
    const emit = newSocket.io.emit.bind(newSocket.io);
    newSocket.io.emit = function (...args) {
      const [eventType, event] = args;
      if (eventType === 'packet') {
        const { data = [] } = event;
        const [eventName, payload] = data;
        const action = { type: eventName, payload };
        dispatch(action);
      }

      setSocket(newSocket);
      return emit(...args);
    };

    return () => {
      setSocket(null);
      return newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, state }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const { socket } = useContext(SocketContext);
  return socket;
};

export const useSocketState = () => {
  const { state } = useContext(SocketContext);
  return state;
};

export const useEmitEvent = eventName => {
  const socket = useSocket();
  return data => socket.emit(eventName, data);
};