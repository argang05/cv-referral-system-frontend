import './globals.css';
import { UserProvider } from '@/context/UserContext';
import LayoutWrapper from './LayoutWrapper'; // ⬅️ Import client wrapper
import { Toaster } from "@/components/ui/sonner";

export const metadata = {
  title: 'CV Referral App',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
          <Toaster position="top-center" richColors />
        </UserProvider>
      </body>
    </html>
  );
}
