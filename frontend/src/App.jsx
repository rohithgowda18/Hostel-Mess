import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/context/theme-context';
import AppRoutes from '@/routes/AppRoutes';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}
