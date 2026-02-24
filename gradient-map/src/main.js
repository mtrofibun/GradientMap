import * as PIXI from 'pixi.js';

const container = document.getElementById('canvasContainer');
let imageCounter = 0;

const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;

let imageWidth = 0;
let imageHeight = 0;

const app = new PIXI.Application();
const layer = new PIXI.Container();


await app.init({
    backgroundColor: 0x000000,
});

container.appendChild(app.canvas);

const gradientInput = document.getElementById('gradientInput');
gradientInput.addEventListener('change', handleFileChange);

function handleFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const url = e.target.result;
        updatePreview(url);
    };
    reader.readAsDataURL(file);
}

function updatePreview(imageUrl) {

    const img = new Image();
        if(img.width >= windowWidth){
            /* scale it somehow with percentage*/
        }
       if (imageCounter === 0) {
        const img = new Image();
        img.onload = () => {
            app.renderer.resize(img.width, img.height);
        };
        img.src = imageUrl;
    }
        const texture = PIXI.Texture.from(img);
        const sprite = new PIXI.Sprite(texture);

        sprite.width = imageWidth;
        sprite.height = imageHeight;

    app.stage.addChild(sprite);
    layer.addChild(sprite);
    imageCounter++;
}

