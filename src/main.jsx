import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import {WalletContextProvider} from './WalletContextProvider.jsx';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        {/* <WalletContextProvider> */}
            <App />
        {/* </WalletContextProvider> */}
    </StrictMode>
);
