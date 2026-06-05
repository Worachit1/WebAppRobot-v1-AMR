import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { OrderProvider } from "./context/OrderContext.jsx";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import OrderSelectRobot from "./pages/OrderSelectRobot.jsx";
import OrderPickup from "./pages/OrderPickup.jsx";
import OrderDrop from "./pages/OrderDrop.jsx";
import OrderConfirm from "./pages/OrderConfirm.jsx";
import OrderSuccess from "./pages/OrderSuccess.jsx";
import History from "./pages/History.jsx";
import Cancel from "./pages/Cancel.jsx";
import Status from "./pages/Status.jsx";
import LiftTest from "./pages/LiftTest.jsx";
import LiftTest2 from "./pages/LiftTest2.jsx";
import DoorTest from "./pages/DoorTest.jsx";
import ZoneList from "./pages/Zonelist.jsx";
import Statustwo from "./pages/Status.two.jsx";
import TaskAssign from "./pages/TaskAssign.jsx";

function isAuthed() {
  return Boolean(localStorage.getItem("authUser"));
}

function RequireAuth({ children }) {
  if (!isAuthed()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <OrderProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/lift-test"
          element={
            <RequireAuth>
              <LiftTest />
            </RequireAuth>
          }
        />
        <Route
          path="/lift-test2"
          element={
            <RequireAuth>
              <LiftTest2 />
            </RequireAuth>
          }
        />
        <Route
          path="/door-test"
          element={
            <RequireAuth>
              <DoorTest />
            </RequireAuth>
          }
        />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />
        <Route
          path="/order/robot"
          element={
            <RequireAuth>
              <OrderSelectRobot />
            </RequireAuth>
          }
        />
        <Route
          path="/order/pickup"
          element={
            <RequireAuth>
              <OrderPickup />
            </RequireAuth>
          }
        />
        <Route
          path="/order/drop"
          element={
            <RequireAuth>
              <OrderDrop />
            </RequireAuth>
          }
        />
        <Route
          path="/order/confirm"
          element={
            <RequireAuth>
              <OrderConfirm />
            </RequireAuth>
          }
        />
        <Route
          path="/order/success"
          element={
            <RequireAuth>
              <OrderSuccess />
            </RequireAuth>
          }
        />
        <Route
          path="/history"
          element={
            <RequireAuth>
              <History />
            </RequireAuth>
          }
        />
        <Route
          path="/cancel"
          element={
            <RequireAuth>
              <Cancel />
            </RequireAuth>
          }
        />
        <Route
          path="/status"
          element={
            <RequireAuth>
              <Status />
            </RequireAuth>
          }
        />
        <Route
          path="/zone-list"
          element={
            <RequireAuth>
              <ZoneList />
            </RequireAuth>
          }
        />

        <Route
          path="/statustwo-test"
          element={
            <RequireAuth>
              <Statustwo />
            </RequireAuth>
          }
        />

        <Route
          path="/task-assign/:zoneId"
          element={
            <RequireAuth>
              <TaskAssign />
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </OrderProvider>
  );
}

export default App;
