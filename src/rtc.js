import * as tf from '@tensorflow/tfjs';
import * as faceapi from 'face-api.js';

const MODEL_FILE = 'model.json';
const BLUR_THRESHOLD = 120;
const GLARE_THRESHOLD = 10;
const VALID_THRESHOLD = 10;

class RTC {
	constructor(video, canvas, cardCanvas, faceCanvas, width, height) {
		this.video = video;
		this.canvas = canvas;
		this.cardCanvas = cardCanvas;
		this.faceCanvas = faceCanvas;
		this.width = width;
		this.height = height;
		this.stream = null;
		this.cap = null;
		this.model = null;
		this.timer = null;
		this.validCount = 0;
		this.constraints = {
			audio: false,
			video: {
				width: this.width,
				height: this.height,
				facingMode: 'environment',
			},
		};
		this.runOpenCV = this.runOpenCV.bind(this);
	}


	startCamera() {
		const { cv } = window;
		navigator.mediaDevices.getUserMedia(this.constraints)
			.then((stream) => {
				this.video.srcObject = stream;
				this.stream = stream;
				this.cap = new cv.VideoCapture(this.video);
				this.validCount = 0;
				return tf.loadLayersModel(MODEL_FILE);
			}).then((model) => {
				this.model = model;
				return faceapi.nets.tinyFaceDetector.loadFromUri('/');
			}).then(() => {
				this.clearCanvas();
				this.timer = requestAnimationFrame(this.runOpenCV);
			})
			.catch((err) => {
				console.log(err);
			});
	}

	async runOpenCV() {
		const { cv } = window;
		if (cv) {
			const mat = new cv.Mat(this.height, this.width, cv.CV_8UC4);
			this.cap.read(mat);
			const resized = new cv.Mat();
			const dsize = new cv.Size(256, 256);
			cv.resize(mat, resized, dsize);
			const dstC3 = new cv.Mat(300, 300, cv.CV_8UC3);
			cv.cvtColor(resized, dstC3, cv.COLOR_RGBA2BGR);

			const matFloat = new cv.Mat();
			dstC3.convertTo(matFloat, cv.CV_32F, 1.0 / 255);
			const tensor = tf.tensor(matFloat.data32F, [1, 256, 256, 3], 'float32');
			const preds = this.model.predict(tensor);
			tensor.dispose();
			try {
				const predictions = await preds.data();
				const output = predictions;

				const mask = cv.matFromArray(256, 256, cv.CV_32F, output);
				const size = new cv.Size(this.height, this.width);
				cv.resize(mask, mask, size);
				cv.threshold(mask, mask, 0.5, 1, cv.THRESH_BINARY);
				// calculate contours
				mask.convertTo(mask, cv.CV_8U, 256);
				const contours = new cv.MatVector();
				const hierarchy = new cv.Mat();
				cv.findContours(
					mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE,
				);
				let cardRect = null;
				let vertices = null;
				for (let i = 0; i < contours.size(); ++i) {
					const rotatedRect = cv.minAreaRect(contours.get(i));
					if (this.isValidContour(rotatedRect.size, cv.RotatedRect.points(rotatedRect))) {
						vertices = cv.RotatedRect.points(rotatedRect);
						cardRect = rotatedRect;
					}
				}
				const dst = new cv.Mat(this.width, this.height, cv.CV_8UC4, new cv.Scalar(0, 0, 0, 0));
				if (cardRect) {
					const rectangleColor = new cv.Scalar(255, 0, 0, 255);
					for (let i = 0; i < 4; i++) {
						cv.line(dst, vertices[i], vertices[(i + 1) % 4], rectangleColor, 2, cv.LINE_AA, 0);
					}
					cv.imshow(this.canvas, dst);
					this.validCount += 1;
					if (this.validCount > VALID_THRESHOLD) {
						const matCopy = mat.clone();
						const captured = this.captureCard(matCopy, cardRect);
						if (captured) return;
					}
				} else {
					this.validCount = 0;
					this.clearCanvas();
				}
				mask.delete();
				dst.delete();
				hierarchy.delete();
				contours.delete();
			} catch (err) {
				console.log(err);
			}
			preds.dispose();
			resized.delete();
			matFloat.delete();
			mat.delete();
			dstC3.delete();
		}
		this.timer = requestAnimationFrame(this.runOpenCV);
	}

	isValidContour(size, vertices) { // eslint-disable-line
		for (let i = 0; i < vertices.length; i++) {
			if (vertices[i].x < 0
				|| vertices[i].x > this.width
				|| vertices[i].y < 0
				|| vertices[i].y > this.height
			) {
				return false;
			}
		}
		const { width, height } = size;
		const max = Math.max(width, height);
		const min = Math.min(width, height);
		if ((min * min) >= this.width * this.height / 5
			&& (min * max) <= this.width * this.height
			&& (max / min) >= 1.4
			&& (max / min) <= 1.8
		) {
			return true;
		}
		return false;
	}

	detectBlurGlare(card) { // eslint-disable-line
		const { cv } = window;
		let isBlurred = true;
		let hasGlare = false;
		let txt = '';
		if (cv) {
			// blur detection
			const matImg = new cv.Mat();
			const lap = new cv.Mat();
			cv.cvtColor(card, matImg, cv.COLOR_RGB2GRAY, 0);
			cv.Laplacian(matImg, lap, cv.CV_64F, 3, 3, 0, cv.BORDER_CONSTANT);
			const mean = new cv.Mat(1, 1, cv.CV_64F);
			const std = new cv.Mat(1, 1, cv.CV_64F);
			cv.meanStdDev(lap, mean, std);
			txt = `${ std.doubleAt(0, 0) }--`;
			isBlurred = std.doubleAt(0, 0) <= BLUR_THRESHOLD;
			// glare detection
			const bi = new cv.Mat();
			cv.threshold(matImg, bi, 250, 255, cv.THRESH_BINARY);
			const contours = new cv.MatVector();
			const hierarchy = new cv.Mat();
			bi.convertTo(bi, cv.CV_8U, 256);
			cv.findContours(
				bi, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE,
			);
			for (let i = 0; i < contours.size(); ++i) {
				const cnt = contours.get(i);
				if (cv.contourArea(cnt, false) > GLARE_THRESHOLD) {
					hasGlare = true;
					txt += 'has glare';
					break;
				}
			}
			contours.delete();
			hierarchy.delete();

			matImg.delete();
			mean.delete();
			std.delete();
			lap.delete();
			bi.delete();
			document.getElementById('msg').innerText = txt;
		}
		return isBlurred || hasGlare;
	}

	captureCard(matCopy, cardRect) {
		let captured = false;
		const { cv } = window;
		const { center, angle } = cardRect;
		const rotatedImg = new cv.Mat();
		const M = cv.getRotationMatrix2D(center, angle, 1);
		cv.warpAffine(
			matCopy, rotatedImg, M, matCopy.size(), cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar(),
		);

		let card = new cv.Mat();
		const x = center.x - (cardRect.size.width / 2);
		const y = center.y - (cardRect.size.height / 2);
		if (x < 0 || y < 0
				|| x + cardRect.size.width > this.width
				|| y + cardRect.size.height > this.height
		) {
			this.clearCanvas();
		} else {
			const rect = new cv.Rect(
				x < 0 ? 0 : x,
				y < 0 ? 0 : y,
				cardRect.size.width,
				cardRect.size.height,
			);
			card = rotatedImg.roi(rect);

			if (!this.detectBlurGlare(card)) {
				this.video.pause();
				cancelAnimationFrame(this.timer);
				captured = true;
				if (card.cols < card.rows) {
					cv.transpose(card, card);
					cv.flip(card, card, 0);
				}

				const ctx = this.cardCanvas.getContext('2d');
				cv.cvtColor(card, card, cv.COLOR_RGBA2RGB);
				const channels = card.channels();
				this.cardCanvas.width = card.cols;
				this.cardCanvas.height = card.rows;
				const imgData = ctx.createImageData(card.cols, card.rows);
				for (let i = 0, j = 0; i < card.data.length; i += channels, j += 4) {
					imgData.data[j] = card.data[i];
					imgData.data[j + 1] = card.data[i + 1];
					imgData.data[j + 2] = card.data[i + 2];
					imgData.data[j + 3] = 255;
				}
				ctx.putImageData(imgData, 0, 0);
				const cardCopy = card.clone();
				this.detectFace(cardCopy);
			} else {
				this.clearCanvas();
				this.validCount = 0;
			}
		}
		matCopy.delete();
		rotatedImg.delete();
		M.delete();
		card.delete();
		return captured;
	}

	async detectFace(cardCopy) {
		const { cv } = window;
		const detection = await faceapi.detectSingleFace(
			this.cardCanvas, new faceapi.TinyFaceDetectorOptions(),
		);
		if (detection) {
			const { box } = detection;
			const {
				x, y, width, height,
			} = box;
			const rect = new cv.Rect(x, y, width, height);
			let face = new cv.Mat();
			face = cardCopy.roi(rect);
			cv.imshow(this.faceCanvas, face);
			face.delete();
		}
		cardCopy.delete();
	}

	stopCamera() {
		this.stream.getTracks().forEach((track) => {
			if (track) track.stop();
		});
		this.localStream = null;
		cancelAnimationFrame(this.timer);
		this.clearCanvas();
	}

	clearCanvas() {
		let ctx = this.canvas.getContext('2d');
		ctx.clearRect(0, 0, this.width, this.height);

		ctx = this.cardCanvas.getContext('2d');
		ctx.clearRect(0, 0, this.width, this.height);

		ctx = this.faceCanvas.getContext('2d');
		ctx.clearRect(0, 0, this.width, this.height);
	}
}

export default RTC;
