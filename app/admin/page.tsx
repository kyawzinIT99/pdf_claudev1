import { AdminDashboard } from "./AdminDashboard";

export const metadata = {
  title: "Staff Admin Panel",
  description: "Create, review and distribute approved community updates.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return <AdminDashboard />;
}
