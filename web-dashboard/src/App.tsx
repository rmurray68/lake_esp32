import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import DashboardNew from './components/DashboardNew';

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
      <Authenticator 
        hideSignUp={true}
        components={{
          SignIn: {
            Footer: () => null,
          },
        }}
      >
        {({ signOut, user }) => (
          <DashboardNew user={user} signOut={signOut} />
        )}
      </Authenticator>
    </ThemeProvider>
  );
}

export default App
