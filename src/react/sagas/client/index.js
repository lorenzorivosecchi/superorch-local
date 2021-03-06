import { all } from "redux-saga/effects";
import { c_updateUserWatcher } from "./updateUser";
import { c_messageWatcher } from "./message";
import { c_loginRequestWatcher } from "./requests/loginRequest";
import { c_loginSuccessWatcher } from "./requests/loginSuccess";
import { c_logoutSuccessWatcher } from "./requests/logoutSuccess";
import { c_logoutRequestWatcher } from "./requests/logoutRequest";
import { c_getUserListSuccessWatcher } from "./requests/getUserListSuccess";
import { c_getUserListRequestWatcher } from "./requests/getUserListRequest";
import { c_updateUserDataRequestWatcher } from "./requests/updateUserDataRequest";
import { c_createDocumentRequestWatcher } from "./requests/createDocumentRequest";
import { c_updateDocumentDataRequestWatcher } from "./requests/updateDocumentDataRequest";
import { c_updateDocumentWatcher } from "./updateDocument";
import { c_getDocumentListRequestWatcher } from "./requests/getDocumentListRequest";
import { c_appendScQueryWatcher } from "./appendScQuery";
import { c_createScQueryWatcher } from "./createScQuery";
import { c_createScQueryRequestWatcher } from "./requests/createScQueryRequest";
import { c_execScQueryRequestWatcher } from "./requests/execScQueryRequest";
import { c_getScQueryDataRequestWatcher } from "./requests/getScQueryDataRequest";
import { c_updateScQueryDataRequestWatcher } from "./requests/updateScQueryDataRequest";
import { c_getDocumentListSuccessWatcher } from "./requests/getDocumentListSuccess";
import { c_createDocumentSuccessWatcher } from "./requests/createDocumentSuccess";

export function* clientSagas() {
  yield all([
    c_messageWatcher(),
    c_updateUserWatcher(),
    c_updateDocumentWatcher(),
    c_appendScQueryWatcher(),
    c_createScQueryWatcher(),
    // Requests
    c_loginRequestWatcher(),
    c_loginSuccessWatcher(),
    c_logoutRequestWatcher(),
    c_logoutSuccessWatcher(),
    c_getUserListRequestWatcher(),
    c_getUserListSuccessWatcher(),
    c_updateUserDataRequestWatcher(),
    c_createDocumentRequestWatcher(),
    c_createDocumentSuccessWatcher(),
    c_updateDocumentDataRequestWatcher(),
    c_getDocumentListRequestWatcher(),
    c_getDocumentListSuccessWatcher(),
    c_createScQueryRequestWatcher(),
    c_execScQueryRequestWatcher(),
    c_getScQueryDataRequestWatcher(),
    c_updateScQueryDataRequestWatcher()
  ]);
}
