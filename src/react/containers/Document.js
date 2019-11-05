import Document from "../components/Document";
import {addMessage} from "../actions/actions";
import {connect} from "react-redux";

const mapStateToProps = state => ({
  document: state.chat.document
});

const mapDispatchToProps = dispatch => ({
  send: (message) => dispatch(addMessage(message))
});

export default connect(mapStateToProps, mapDispatchToProps)(Document);
