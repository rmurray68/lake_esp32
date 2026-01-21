import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import DashboardNew from './components/DashboardNew';
import DashboardProd from './components/DashboardProd';

// Use local backend in development, Lambda in production
const USE_LOCAL_BACKEND = import.meta.env.VITE_USE_LOCAL_BACKEND === 'true';
const Dashboard = USE_LOCAL_BACKEND ? DashboardNew : DashboardProd;

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Authenticator>
        {({ signOut, user }) => (
          <Dashboard user={user} signOut={signOut} />
        )}
      </Authenticator>
    </ThemeProvider>
  );
}

export default App
