const canvasContainer = document.getElementById('canvasContainer');
let imageCounter = 0;
let originalImageUrl = null;
const layers = [];

const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;

let maxWidth = windowWidth;
let maxHeight = windowHeight;

const app = new PIXI.Application();
const layer = new PIXI.Container();


await app.init({
    backgroundColor: 0x000000,
    width: maxWidth * 0.5,
    height: maxHeight * 0.5,
});


canvasContainer.appendChild(app.canvas);
app.stage.addChild(layer);

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
    addImageLayer(imageUrl); 
}

function addImageLayer(imageUrl) {
    const img = new Image();

    img.onload = async () => {
        const pixiContainer = new PIXI.Container();
        pixiContainer.label = `Layer ${layers.length + 1}`;

        const texture = await PIXI.Assets.load(imageUrl);
        const sprite = new PIXI.Sprite(texture);

        sprite.originalWidth = img.width;
        sprite.originalHeight = img.height;

        const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
        sprite.width = img.width * scale;
        sprite.height = img.height * scale;
        if (imageCounter === 0) {
        app.renderer.resize(sprite.width, sprite.height);
        maxHeight = sprite.height;
        maxWidth = sprite.width;
        }
        pixiContainer.addChild(sprite);
        app.stage.addChild(pixiContainer);
        
        layers.push({
            container : pixiContainer,
            sprite,
            imageUrl,
            originalWidth: img.width,
            originalHeight: img.height,
            gradientMap: null,
        });
         imageCounter++;
        updateLayerUI();
    };
   
    img.src = imageUrl;
}

async function downloadImage(){
    if(!originalImageUrl) return;
    const img = new Image();

    /* try to retain all the gradient maps n layers */

}

function updateLayerUI() {
    const layerList = document.getElementById('layerPanel');
    layerList.innerHTML = '';

    layers.forEach((layer, index) => {
        const item = document.createElement('div');
        item.textContent = layer.container.label;

        const toggle = document.createElement('button');
        toggle.textContent = '👁';
        toggle.onclick = () => {
            layer.container.visible = !layer.container.visible;
        };

        const remove = document.createElement('button');
        remove.textContent = "🗑️"
        remove.onclick = () =>{
            
        }
        item.appendChild(toggle);
        item.appendChild(remove);
        layerList.appendChild(item);
    });
}