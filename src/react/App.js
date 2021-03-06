import React, { Component } from "react";
import { Provider } from "react-redux";
import styled from "styled-components/macro";
import normalize from "styled-normalize";
import reset from "styled-reset";
import configureStore from "./store";
import { connect as connectSocket } from "@giantmachines/redux-websocket";
import { channels } from "../shared/constants";

// Actions
import { digestAppCredits } from "./actions/digestAppCredits";
import { s_message } from "./actions/server/message";
import { s_clientDisconnected } from "./actions/server/clientDisconnected";
import { s_clientConnected } from "./actions/server/clientConnected";
import { updateBaseData } from "./actions/updateBaseData";

// Components
import { createGlobalStyle } from "styled-components";
import SideBar from "./components/SideBar/index";
import Header from "./components/Header/index";
import StatusBar from "./components/StatusBar/index";
import MainBar from "./components/MainBar/MainBar";
import { s_serverStarted } from "./actions/server/serverStarted";

/* =============================================== */
/*    REDUX                                        */
/* =============================================== */

const initialState = {};
const store = configureStore(initialState);

/* =============================================== */
/*    ELECTRON                                     */
/* =============================================== */

const { ipcRenderer } = window;

if (ipcRenderer) {
  // When there are some updates available:
  ipcRenderer.on("update_available", () => {
    ipcRenderer.removeAllListeners("update_available");
    let message = "A new update is available. Downloading now...";
    console.info(message);
  });
  ipcRenderer.on("update_downloaded", () => {
    ipcRenderer.removeAllListeners("update_downloaded");
    let message =
      "Update Downloaded. It will be installed on restart. Restart now?";
    console.info(message);
  });
}

/* =============================================== */
/*    STYLES                                       */
/* =============================================== */

export const GlobalStyle = createGlobalStyle`
  ${normalize}
  ${reset}
  html, body {
    height: 100%;
  }
  #root {
    height: 100%;
  }
  body {
    font-family: sans-serif;
  }
`;

// Styles
export const StyledContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

export const StyledWrapper = styled.div`
  flex: 1 1 100%;
  overflow-y: auto;
  display: flex;
  border-top: solid 1px black;
  border-bottom: solid 1px black;
`;

/**
 * ============================
 *    REACT ROOT COMPONENT
 * ============================
 */
class App extends Component {
  constructor(props) {
    super(props);

    // Set base data
    store.dispatch(
      updateBaseData({
        runsOnElectron: !!ipcRenderer
      })
    );

    // If it's app runs on electron
    if (ipcRenderer) {
      // Request app info.
      ipcRenderer.send(channels.APP_INFO);
      // When request response arrives:
      ipcRenderer.on(channels.APP_INFO, (event, arg) => {
        // Send data to the store.
        store.dispatch(
          digestAppCredits({
            name: arg.appName,
            version: arg.appVersion
          })
        );
        ipcRenderer.removeAllListeners(channels.APP_INFO);
      });

      ipcRenderer.send(channels.START_SUPERCOLLIDER);
      ipcRenderer.send(channels.START_WS_SERVER);

      // Websocket messages
      // ------------------
      ipcRenderer.on(channels.WS_SERVER_STARTED, (event, arg) => {
        store.dispatch(s_serverStarted(arg));
        const { server } = store.getState();
        store.dispatch(connectSocket(server.status.wsEndpoint));
      });

      ipcRenderer.on(channels.WEBSOCKET_OPEN, (event, arg) => {
        store.dispatch(s_clientConnected(arg.clientId, arg.clientData));
      });
      ipcRenderer.on(channels.WEBSOCKET_CLOSED, (event, arg) => {
        store.dispatch(s_clientDisconnected(arg.clientId));
      });
      ipcRenderer.on(channels.WEBSOCKET_MESSAGE, (event, arg) => {
        store.dispatch(s_message(arg.clientId, arg.message));
      });
    }
  }

  componentDidMount() {
    if (!ipcRenderer) {
      const port = process.env.SERVER_PORT || 8000;
      store.dispatch(connectSocket(`ws://localhost:${port}`));
    }
  }

  render() {
    return (
      <Provider store={store}>
        <StyledContainer className="App">
          <GlobalStyle />
          <Header />
          <StyledWrapper>
            <SideBar />
            <MainBar />
          </StyledWrapper>
          <StatusBar />
        </StyledContainer>
      </Provider>
    );
  }
}

export default App;
