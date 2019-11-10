import React from "react";
import styled from 'styled-components';
import _ from 'lodash';
import {
  convertToRaw,
  convertFromRaw,
  Editor,
  EditorState,
  getDefaultKeyBinding,
  CompositeDecorator,
  KeyBindingUtil,
  Modifier,
  RichUtils
} from 'draft-js';
import {findWithRegex, getSelectedBlocksList, getSelectedTextBlocks} from '../utils/draftjs';
import {lowerCasedProps} from "../utils/common";


// ----------------------
// Styled Components
// ----------------------

const StyledWrapper = styled.div`
   flex: 1;
`;

// -----------------------
// Key Binding Function
// -----------------------

const { hasCommandModifier } = KeyBindingUtil;

const keyBindingFn = (e) => {
  if (e.keyCode === 13 /* `CR` key */ && hasCommandModifier(e)) {
    return 'execute-selected-block';
  }
  return getDefaultKeyBinding(e);
};

// ------------------------
// Entities
// ------------------------

/**
 *
 * @param editorState
 * @param selectionState
 * @returns {EditorState}
 */
function createLinkEntity(editorState, selectionState) {
  const contentState = editorState.getCurrentContent();
  const contentStateWithEntity = contentState.createEntity(
    'LINK',
    'MUTABLE',
    {url: 'http://www.zombo.com'}
  );
  const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
  const contentStateWithLink = Modifier.applyEntity(
    contentStateWithEntity,
    selectionState,
    entityKey
  );
  return EditorState.push(editorState, contentStateWithLink);
}

function createExecBlockEntity(editorState, selectionState) {
  const contentState = editorState.getCurrentContent();
  const contentStateWithEntity = contentState.createEntity(
    'EXEC_BLOCK',
    'MUTABLE',
    { times: 1 }
  );
  const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
  const contentStateWithLink = Modifier.applyEntity(
    contentStateWithEntity,
    selectionState,
    entityKey
  );
  return EditorState.push(editorState, contentStateWithLink);
}

/**
 *
 * @param contentBlock
 * @param callback
 * @param contentState
 */
function findLinkEntities(contentBlock, callback, contentState) {
  contentBlock.findEntityRanges(
    (character) => {
      const entityKey = character.getEntity();
      return (
        entityKey !== null &&
        contentState.getEntity(entityKey).getType() === 'LINK'
      );
    },
    callback,
  );
};

/**
 *
 * @param contentBlock
 * @param callback
 * @param contentState
 */
function findExecBlockEntities(contentBlock, callback, contentState) {
  contentBlock.findEntityRanges(
    (character) => {
      const entityKey = character.getEntity();
      return (
        entityKey !== null &&
        contentState.getEntity(entityKey).getType() === 'EXEC_BLOCK'
      );
    },
    callback,
  );
};

// ------------------------
// DECORATOR
// ------------------------

const compositeDecorator = new CompositeDecorator([
  {
    strategy: (
      contentBlock,
      callback,
      contentState
    ) => findLinkEntities(contentBlock, callback, contentState),
    component: LinkComponent,
  },
  {
    strategy: (
      contentBlock,
      callback,
      contentState
    ) => findExecBlockEntities(contentBlock, callback, contentState),
    component: ExecBlockComponent,
  }
]);

// ------------------------
// Text Editor Component
// ------------------------

export default class TextEditor extends React.Component {

  constructor(props) {
    super(props);

    // Initialize component state.
    this.state = {
      editorState: EditorState.createEmpty(compositeDecorator),
      readOnly: false
    };

    this.setDomEditorRef = ref => this.domEditor = ref;

    // This function forces the editor to be focused.
    this.focus = () => this.domEditor.focus();

    // Event Handler Bindings
    this.onChange = this.onChange.bind(this);
  }

  /**
   * COMPONENT DID UPDATE
   * ==================================================
   * This class is called every time the component
   * needs to update it's internal state.
   * Example: when setState is called or when its props
   * change.
   *
   * @param prevProps
   * @param prevState
   * @param snapshot
   */
  componentDidUpdate(prevProps, prevState, snapshot) {
    const { remote } = this.props;
    // If remote document has changed:
    if (prevProps.remote.input.value !== remote.input.value) {
      // Update editorState with new content
      const newContent = convertFromRaw(JSON.parse(remote.input.value));
      const newState = EditorState.push(this.state.editorState, newContent, "change-block-data");
      this.setState({
        editorState: newState
      })
    }
  }


  /**
   * HANDLE KEY COMMAND
   * ==================================================
   * This function is called every time a key command
   * is invoked by the user, example cmd + b
   * @param command
   * @param editorState
   * @returns {string}
   */
  handleKeyCommand(command, editorState) {
    // If a custom event has been invoked:
    if (command === "execute-selected-block") {
      const selectionState = editorState.getSelection();

      // Split selection into content boxes
      const anchorKey = selectionState.getAnchorKey();
      const currentContent = editorState.getCurrentContent();
      const currentContentBlock = currentContent.getBlockForKey(anchorKey);
      const entityKey = currentContentBlock.getEntityAt(0);

      // If entity already exists:
      if (entityKey) {
        // Modify entity metadata
        const { data } = currentContent.getEntity(entityKey);
        currentContent.replaceEntityData(entityKey, {
          times: data.times + 1
        })
      }
      // If entity doesn't exists:
      else {
        const newState = createExecBlockEntity(editorState, selectionState);
        this.onChange(newState);
      }
      return 'handled';
    }
    return 'not-handled';
  }

  /**
   * ON CHANGE
   * ===================================
   * This function is called every time the editor
   * needs to update it's internal data,
   * example: when user types some text
   * @param editorState
   */
  onChange(editorState) {
    // Update editor state
    this.setState({editorState});

    // Extrapolate raw contentState
    const contentState = editorState.getCurrentContent();
    const raw = convertToRaw(contentState);

    // And send it the socket server as a string
    this.props.textInput(JSON.stringify(raw));
  }

  /**
   * RENDER
   * ============
   * @returns {*}
   */
  render() {
    return (
      <StyledWrapper
        data-test={"TextEditorComponent"}
        onClick={this.focus} >
        <Editor
          ref={this.setDomEditorRef}
          editorState={this.state.editorState}
          onChange={this.onChange}
          handleKeyCommand={this.handleKeyCommand}
          keyBindingFn={keyBindingFn}
          readOnly={this.state.readOnly}
        />
      </StyledWrapper>
    )
  }
}



// ------------------------
// Decorator Components
// ------------------------

/**
 * SIGNED SPAN
 * ================
 * @param props
 * @returns {*}
 * @constructor
 */
function LinkComponent(props) {
  const style = {
    color: "blue",
    textDecoration: "underline"
  };
  return (
    <span {...lowerCasedProps(props)} style={style}>
      {props.children}
    </span>
  );
}

/**
 *
 * @param props
 * @returns {*}
 * @constructor
 */
function ExecBlockComponent(props) {
  const style = {
    background: "yellow",
  };

  // Get data
  const { entityKey, contentState } = props;
  const { data } = contentState.getEntity(entityKey);

  return (
    <span {...lowerCasedProps(props)} style={style}>
      {props.children}
      <span>{data.times}</span>
    </span>
  );
}
