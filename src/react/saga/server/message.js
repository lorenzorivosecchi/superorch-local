import { actionTypes } from "../../actions/actionTypes";
import { takeLatest, put, select, call } from "redux-saga/effects";
import { s_loginResponseSaga } from "./responses/loginResponse";
import { s_logoutResponseSaga } from "./responses/logoutResponse";
import { s_getUserListResponseSaga } from "./responses/getUserListResponse";
import { s_updateUserDataResponseSaga } from "./responses/updateUserDataResponse";
import { s_createDocumentResponseSaga } from "./responses/createDocumentResponse";
import { selectClient, selectUser } from "../../reducers/root";
import { s_transmit } from "../../actions/server/transmit";
import { s_messageError } from "../../actions/server/message";
import { statusCodes } from "../../utils/constants";

export function* s_messageWatcher() {
  yield takeLatest(actionTypes.S_MESSAGE, s_messageSaga);
}

export function* s_messageSaga(action) {
  try {
    // Unpack message
    const { clientId } = action;
    const message = JSON.parse(action.message);

    console.log(`server received a message: ${message.type}`);

    // If it's a login request handle it and leave
    if (message.type === actionTypes.C_LOGIN_REQUEST) {
      return yield call(s_loginResponseSaga, clientId, message.userData);
    }

    // Get user associated with the client
    const { userId } = yield select(state => selectClient(state, clientId));
    const user = yield select(state => selectUser(state, userId));

    // If user is undefined then communication should be interrupted
    if (!user) {
      return yield put(
        s_transmit(clientId, s_messageError(400, `Log in is required`))
      );
    }

    // Handle actions embedded in the message
    switch (message.type) {
      case actionTypes.C_LOGOUT_REQUEST:
        return yield call(s_logoutResponseSaga, clientId);
      case actionTypes.C_GET_USER_LIST_REQUEST:
        return yield call(s_getUserListResponseSaga, clientId);
      case actionTypes.C_UPDATE_USER_DATA_REQUEST:
        return yield call(
          s_updateUserDataResponseSaga,
          clientId,
          message.userData
        );
      case actionTypes.C_CREATE_DOCUMENT_REQUEST:
        return yield call(
          s_createDocumentResponseSaga,
          clientId,
          message.docData
        );
    }
  } catch (error) {
    console.error(error);
    yield put(
      s_transmit(action.clientId, s_messageError(500, statusCodes[500]))
    );
  }
}
