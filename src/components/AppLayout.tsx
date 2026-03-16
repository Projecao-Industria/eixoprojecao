import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import MobileHeader from "./MobileHeader";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <MobileHeader />
        <main className="flex-1 p-4 md:p-8 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
