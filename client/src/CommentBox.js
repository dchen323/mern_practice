import React, { Component } from 'react';
import 'whatwg-fetch';
import CommentList from './CommentList';
import CommentForm from './CommentForm';
import DATA from './data';
import './CommentBox.css';

class CommentBox extends Component {
  constructor() {
    super();
    this.state = {
      data: [] ,
      error: null,
      author: '',
      text: ''
    };

    this.pollInterval = null;

    this.loadCommentsFromServer = this.loadCommentsFromServer.bind(this);
    this.onChangeText = this.onChangeText.bind(this);
    this.submitComment = this.submitComment.bind(this);
    this.updateComment = this.updateComment.bind(this);
    this.onDeleteComment = this.onDeleteComment.bind(this);
    this.submitNewComment = this.submitNewComment.bind(this);
    this.submitUpdatedComment = this.submitUpdatedComment.bind(this);
  }

  componentDidMount() {
    this.loadCommentsFromServer();
    if(!this.pollInterval) {
      this.pollInterval = setInterval(this.loadCommentsFromServer, 2000);
    }
  }

  componetWillUnmount() {
    if(this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = null;
  }

  loadCommentsFromServer(){
    fetch('/api/comments')
    .then(data => data.json())
    .then(res => {
      if(!res.success) this.setState({error: res.error});
      else this.setState({data: res.data});
    });
  }

  onChangeText(e){
    const newState = this.state;
    newState[e.target.name] = e.target.value;
    this.setState(newState);
  }

  updateComment(id){
    const oldComment = this.state.data.find(c => c._id === id);
    if(!oldComment) return;
    this.setstate({
      author: oldComment.author,
      text: oldComment.text,
      updateId: id
    });
  }

  onDeleteComment(id){
    const idx = this.state.data.findIndex(c => c._id === id);
    const data = [
      ...this.state.data.slice(0,idx),
      ...this.state.data.slice(idx + 1)
    ];
    this.setState({ data });
    fetch(`api/comments/${id}`, { method: 'DELETE'})
    .then(res => res.json()).then(res => {
      if(!res.success) this.setState({error: res.error});
    });
  }

  submitComment(e){
    e.preventDefault();
    const { author, text,updateId } = this.state;
    if(!author || !text) return;
    if(updateId){
      this.submitUpdatedComment();
    }else{
      this.submitNewComment();
    }
  }

  submitNewComment() {
    const { author, text } = this.state;
    const data = [
      ...this.state.data,
      {
        author,
        text,
        _id: Date.now().toString(),
        updatedAt: new Date(),
        createdAt: new Date()
      }
    ];

    this.setState({ data });
    fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify({ author, text})
    }).then(res => res.json()).then(res => {
      if(!res.success) this.setState({error: res.error.message || res.error});
      else this.setState({author: '', text: '', error: null});
    });
  }

  submitUpdatedComment(){
    const { author, text, updateId } = this.state;
    fetch(`/api/comments/${updateId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify({ author,text})
    }).then(res => res.json()).then(res => {
      if(!res.success) this.setState({error: res.error.message || res.error});
      else this.setState({author: '', text: '', updatedId: null});
    });
  }

  render(){
    return(
      <div className="container">
       <div className="comments">
         <h2>Comments:</h2>
         <CommentList data={this.state.data}
           handleDeleteComment={this.onDeleteComment}
           hanldeUpdateComment={this.updateComment}/>
       </div>
       <div className="form">
         <CommentForm
           author={this.state.author}
           text={this.state.text}
           handleChangeText={this.onChangeText}
           handleSubmit={this.submitComment}/>
       </div>
       {this.state.error && <p>{this.state.error}</p>}
     </div>
   );
  }
}

export default CommentBox;
