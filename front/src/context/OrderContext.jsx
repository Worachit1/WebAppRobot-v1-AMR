import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const OrderContext = createContext(null);

export function OrderProvider({ children }) {
  const [robot, setRobot] = useState(null);
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);

  const reset = useCallback(() => {
    setRobot(null);
    setPickup(null);
    setDrop(null);
  }, []);

  const value = useMemo(
    () => ({
      robot,
      pickup,
      drop,
      setRobot,
      setPickup,
      setDrop,
      reset
    }),
    [robot, pickup, drop, reset]
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder() {
  const ctx = useContext(OrderContext);
  if (!ctx) {
    throw new Error("useOrder must be used within OrderProvider");
  }
  return ctx;
}
