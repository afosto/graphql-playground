import * as React from 'react'
import EditorWrapper from './EditorWrapper'
import { styled } from '../../styled'

export interface Props {
  value?: string
  onEdit?: (value: string) => void
  onPrettifyQuery?: () => void
  onRunQuery?: () => void
  editorTheme?: string
  readOnly?: boolean
  isYaml?: boolean
}

/**
 * The editor to edit json and yaml
 */
export class ConfigEditor extends React.Component<Props, {}> {
  editor: any
  cachedValue: any
  node: HTMLDivElement
  ignoreChangeEvent: boolean

  constructor(props) {
    super(props)

    // Keep a cached version of the value, this cache will be updated when the
    // editor is updated, which can later be used to protect the editor from
    // unnecessary updates during the update lifecycle.
    this.cachedValue = props.value || ''
  }

  componentDidMount() {
    // Lazily require to ensure requiring GraphiQL outside of a Browser context
    // does not produce an error.
    const CodeMirror = require('codemirror')
    require('codemirror/addon/hint/show-hint')
    require('codemirror/addon/edit/matchbrackets')
    require('codemirror/addon/edit/closebrackets')
    require('codemirror/addon/fold/brace-fold')
    require('codemirror/addon/fold/foldgutter')
    require('codemirror/addon/lint/lint')
    require('codemirror/addon/search/searchcursor')
    require('codemirror/addon/search/jump-to-line')
    require('codemirror/addon/dialog/dialog')
    require('codemirror/keymap/sublime')
    require('codemirror/mode/yaml/yaml')
    require('codemirror-graphql/variables/hint')
    require('codemirror-graphql/variables/lint')
    require('codemirror-graphql/variables/mode')

    this.editor = CodeMirror(this.node, {
      value: this.props.value || '',
      lineNumbers: true,
      tabSize: 2,
      mode: this.props.isYaml ? 'yaml' : 'graphql-variables',
      theme: this.props.editorTheme || 'graphiql',
      keyMap: 'sublime',
      autoCloseBrackets: true,
      matchBrackets: true,
      showCursorWhenSelecting: true,
      readOnly: this.props.readOnly ? 'nocursor' : false,
      foldGutter: {
        minFoldSize: 4,
      },
      gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
      extraKeys: {
        'Cmd-Space': () => this.editor.showHint({ completeSingle: false }),
        'Ctrl-Space': () => this.editor.showHint({ completeSingle: false }),
        'Alt-Space': () => this.editor.showHint({ completeSingle: false }),
        'Shift-Space': () => this.editor.showHint({ completeSingle: false }),

        'Cmd-Enter': () => {
          if (this.props.onRunQuery) {
            this.props.onRunQuery()
          }
        },
        'Ctrl-Enter': () => {
          if (this.props.onRunQuery) {
            this.props.onRunQuery()
          }
        },

        'Shift-Ctrl-P': () => {
          if (this.props.onPrettifyQuery) {
            this.props.onPrettifyQuery()
          }
        },

        // Persistent search box in Query Editor
        'Cmd-F': 'findPersistent',
        'Ctrl-F': 'findPersistent',

        // Editor improvements
        'Ctrl-Left': 'goSubwordLeft',
        'Ctrl-Right': 'goSubwordRight',
        'Alt-Left': 'goGroupLeft',
        'Alt-Right': 'goGroupRight',
      },
    })

    this.editor.on('change', this.onEdit)
    this.editor.on('keyup', this.onKeyUp)
  }

  componentDidUpdate(prevProps) {
    // Ensure the changes caused by this update are not interpretted as
    // user-input changes which could otherwise result in an infinite
    // event loop.
    this.ignoreChangeEvent = true
    if (
      this.props.value !== prevProps.value &&
      this.props.value !== this.cachedValue
    ) {
      this.cachedValue = this.props.value
      this.editor.setValue(this.props.value)
    }
    this.ignoreChangeEvent = false
  }

  componentWillUnmount() {
    this.editor.off('change', this.onEdit)
    this.editor.off('keyup', this.onKeyUp)
    this.editor = null
  }

  render() {
    return (
      <EditorWrapper>
        <Editor ref={this.setNode} />
      </EditorWrapper>
    )
  }

  setNode = (node) => {
    this.node = node
  }

  /**
   * Public API for retrieving the CodeMirror instance from this
   * React component.
   */
  getCodeMirror() {
    return this.editor
  }

  /**
   * Public API for retrieving the DOM client height for this component.
   */
  getClientHeight() {
    return this.node && this.node.clientHeight
  }

  private onKeyUp = (cm, event) => {
    const code = event.keyCode
    if (
      (code >= 65 && code <= 90) || // letters
      (!event.shiftKey && code >= 48 && code <= 57) || // numbers
      (event.shiftKey && code === 189) || // underscore
      (event.shiftKey && code === 222) // "
    ) {
      this.editor.execCommand('autocomplete')
    }
  }

  private onEdit = () => {
    if (!this.ignoreChangeEvent) {
      this.cachedValue = this.editor.getValue()
      if (this.props.onEdit) {
        this.props.onEdit(this.cachedValue)
      }
    }
  }
}

const Editor = styled.div`
  flex: 1;
  height: 100%;
  position: relative;
  .CodeMirror-linenumbers {
    background: ${(p) => p.theme.editorColours.resultBackground};
  }
`
