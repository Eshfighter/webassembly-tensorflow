import React, { Component } from 'react';
import RTC from './rtc';

import './style.css';

class App extends Component {
	constructor(props) {
		super(props);
		this.rtc = null;
		this.video = React.createRef();
		this.canvas = React.createRef();
		this.cardCanvas = React.createRef();
		this.faceCanvas = React.createRef();
		this.height = 0;
		this.width = 0;
		this.startCamera = this.startCamera.bind(this);
		this.stopCamera = this.stopCamera.bind(this);
		this.initRTC = this.initRTC.bind(this);
		this.pooling = setInterval(this.initRTC, 500);

		this.state = {
			loading: true,
		};
	}

	componentDidMount() {
		// const ratio = window.devicePixelRatio || 1;
		// handle size
		this.width = (window.innerWidth > 0) ? window.innerWidth : screen.width; // eslint-disable-line
		if (this.width > 640) this.width = 640;
		this.height = this.width;
		this.video.current.height = this.height;
		this.video.current.width = this.width;
		this.canvas.current.height = this.height;
		this.canvas.current.width = this.width;

		this.video.current.style.width = `${ this.width }px`;
		this.video.current.style.height = `${ this.height }px`;
		this.video.current.setAttribute('autoplay', '');
		this.video.current.setAttribute('muted', '');
		this.video.current.setAttribute('playsinline', '');

		// fix dpi for cardCanvas
		// this.cardCanvas.current.style.width = `${ this.width }px`;
		// this.cardCanvas.current.style.height = `${ this.height }px`;
		// this.cardCanvas.current.width = this.width * ratio;
		// this.cardCanvas.current.height = this.height * ratio;
		// const ctx = this.cardCanvas.current.getContext('2d');
		// ctx.scale(ratio, ratio);
	}

	initRTC() {
		if (window.cv && window.cv.Mat) {
			clearInterval(this.pooling);
			this.setState({ loading: false });
			this.rtc = new RTC(
				this.video.current, this.canvas.current, this.cardCanvas.current, this.faceCanvas.current,
				this.width, this.height,
			);
			this.rtc.startCamera();
		}
	}

	startCamera() {
		if (this.rtc) {
			this.rtc.startCamera();
		}
	}

	stopCamera() {
		if (this.rtc) {
			this.rtc.stopCamera();
		}
	}

	render() {
		const msg = this.state.loading ? 'OpenCV.js is loading...' : 'OpenCV.js is ready';
		return (
			<div>
				<div>
					<video muted ref={ this.video } autoPlay className='local-video' />
					<canvas ref={ this.canvas } className='canvas' />
				</div>
				<p id='msg'>{ msg }</p>
				<button type='button' onClick={ this.startCamera }>Start</button>
				<button type='button' onClick={ this.stopCamera }>Stop</button>
				<div className='output'>
					<canvas ref={ this.cardCanvas } width='100%' />
				</div>
				<div className='face'>
					<canvas ref={ this.faceCanvas } width='100%' />
				</div>
				<p id='ocr' />
			</div>
		);
	}
}

export default App;
