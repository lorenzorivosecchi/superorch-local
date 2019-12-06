import { actionTypes } from "../../actions/actionTypes";
import { takeLatest, put } from "redux-saga/effects";
import {
  wsGetUserListError,
  wsGetUserListSuccess
} from "../../actions/ws/getUserList";
import {
  wsCreateUserError,
  wsCreateUserSuccess
} from "../../actions/ws/createUser";
import { addUser } from "../../actions/addUser";
import { deleteUser } from "../../actions/deleteUser";
import { updateUser } from "../../actions/updateUser";

export function* wsMessageWatcher() {
  yield takeLatest(actionTypes.WS_MESSAGE, wsMessageSaga);
}

export function* wsMessageSaga({ payload }) {
  const message = JSON.parse(payload.message);
  switch (message.type) {
    case actionTypes.WS_CREATE_USER_SUCCESS:
      return yield put(wsCreateUserSuccess(message.userId));

    case actionTypes.WS_CREATE_USER_ERROR:
      return yield put(wsCreateUserError(message.error));

    case actionTypes.WS_GET_USER_LIST_SUCCESS:
      return yield put(wsGetUserListSuccess(message.userList));

    case actionTypes.WS_GET_USER_LIST_ERROR:
      return yield put(wsGetUserListError(message.error));

    case actionTypes.WS_USER_JOINED:
      return yield put(addUser(message.user.id, message.user));

    case actionTypes.WS_USER_LEFT:
      return yield put(deleteUser(message.userId));

    case actionTypes.WS_USER_UPDATE:
      return yield put(updateUser(message.userId, message["diff"]));
  }
}
