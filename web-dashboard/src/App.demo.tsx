import {
  Container,
  CssBaseline,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import Dashboard from './components/Dashboard';

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

// Demo mode - no authentication required
function App() {
  const mockUser = {
    userId: 'demo-user',
    username: 'demo@example.com',
  } as any;

  const mockSignOut = () => {
    console.log('Demo mode - sign out clicked');
    alert('Demo mode: Authentication disabled for testing');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Dashboard user={mockUser} signOut={mockSignOut} />
      </Container>
    </ThemeProvider>
  );
}

export default App;
