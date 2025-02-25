import { Metadata } from 'next';
import DashboardLayoutClient from './DashboardLayoutClient';

export const metadata: Metadata = {
  title: {
    template: '%s | HealthDoc Dashboard',
    default: 'Dashboard | HealthDoc',
  },
  description: 'Manage your health reports and view insights.',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
