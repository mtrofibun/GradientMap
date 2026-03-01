const canvasContainer = document.getElementById('canvasContainer');
let imageCounter = 0;
let originalImageUrl = null;
let dragSrcIndex = null;
const layers = [];
const blend_modes = ['multiply','screen','overlay','color-dodge','linear-burn','subtract','lighten', 'glow-dodge','glow','add','add(glow)','soft-light','hard-light','brightness','pin-light','hard-mix']
let added_presets = {};

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

app.stage.eventMode = 'static';

const toggleBtn = document.getElementById('togglebtn');
const sidebar = document.getElementById('layerContainer');

toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('hidden');
});

const downloadGradient = document.getElementById("downloadg");
downloadGradient.addEventListener("click", ()=>{
    const opt = document.createElement('option');
    layers
    .filter(layer => layer.gradient !== null)
    .forEach( layer =>{
        const select = document.createElement('select');
        select.textContent = /* layer name put it in the object */
        opt.appendChild(select);
    })
}) 

const importGradient = document.getElementById("importg");
importGradient.addEventListener("click", ()=>{

})

function buildGradientTexture(colors){
    const canvas = document.createElement('canvas');
    width = 256;
    height = 1;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0,0,256,0);
    colors.forEach((color,i)=>{
        grad.addColorStop(i/(colors.length-1),color);
    });
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,256,1);
    return PIXI.Texture.from(canvas);
}

function buildGradientMapFilter(colors) {
    const gradTex = buildGradientTexture(colors);

    const filter = new PIXI.Filter({
        glProgram: new PIXI.GlProgram({
            vertex: `
                in vec2 aPosition;
                out vec2 vTextureCoord;
                uniform mat3 projectionMatrix;
                void main() {
                    gl_Position = vec4((projectionMatrix * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
                    vTextureCoord = aPosition;
                }
            `,
            fragment: `
                in vec2 vTextureCoord;
                out vec4 finalColor;
                uniform sampler2D uTexture;
                uniform sampler2D uGradient;
                void main() {
                    vec4 color = texture(uTexture, vTextureCoord);
                    float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
                    vec4 mapped = texture(uGradient, vec2(brightness, 0.5));
                    finalColor = vec4(mapped.rgb, color.a);
                }
            `,
        }),
        resources: {
            uGradient: gradTex.source,
        },
    });
    /* add this info into json on a layer thing when im not lazy maybe a pointer or smth towards this */
    return filter;
}


export function addAdjustmentLayer(app, layers, colors, blendMode, updateLayerUI) {
    const canvas = document.createElement('canvas');
    canvas.width =  maxWidth;
    canvas.height = maxHeight;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, maxWidth, 0);
    colors.forEach((color, i) => {
        grad.addColorStop(i / (colors.length - 1), color);
    });
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, maxWidth, maxHeight);

    const texture = PIXI.Texture.from(canvas);
    const sprite = new PIXI.Sprite(texture);
    sprite.width = maxWidth;
    sprite.height = maxHeight;
    sprite.blendMode = blendMode;

    const pixiContainer = new PIXI.Container();
    pixiContainer.label = `Gradient Map ${layers.filter(l => l.type === 'adjustment').length + 1}`;
    pixiContainer.addChild(sprite);
    app.stage.addChild(pixiContainer);

    layers.push({
        type: 'adjustment',
        container: pixiContainer,
        sprite,
        colors,
        blendMode,
        originalWidth: app.screen.width,
        originalHeight: app.screen.height,
    });

    updateLayerUI();
}

const selectImage = document.getElementById('selectImage');
selectImage.addEventListener('change', handleFileChange);

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

        sprite.eventMode = 'static'
        sprite.cursor = 'pointer';

        let isDragging = false;
        let dragOffsetX = 0;
        let dragOffsetY = 0;

        

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

        sprite.on('pointerdown', (e) => {
            isDragging = true;
            const pos = app.stage.toLocal(e.global);
            dragOffsetX = pos.x - sprite.x;
            dragOffsetY = pos.y - sprite.y;
        });

        app.stage.on('pointermove', (e) => {
            if (!isDragging) return;
            const pos = app.stage.toLocal(e.global);
            sprite.x = pos.x - dragOffsetX;
            sprite.y = pos.y - dragOffsetY;
            
        });

        app.stage.on('pointerup', () => {
            isDragging = false;
        });
        pixiContainer.addChild(sprite);
        app.stage.addChild(pixiContainer);
        
        layers.push({
            container : pixiContainer,
            sprite,
            imageUrl,
            originalWidth: img.width,
            originalHeight: img.height,
            gradientMap: null,
            blendMode: 'normal', 
        });

        
         imageCounter++;
        updateLayerUI(app,layers,'layerPanel');
    };
   
    img.src = imageUrl;
}

async function downloadImage(){
    if(!originalImageUrl) return;
    const img = new Image();

    /* try to retain all the gradient maps n layers */

}

function updateLayerUI(app,layers,panelId = 'layerPanel') {
    const layerList = document.getElementById(panelId);
    layerList.innerHTML = '';
    [...layers].reverse().forEach((layer,reversedIndex)=>{
        const realIndex = layers.length - 1 - reversedIndex;

        const item = document.createElement('div');
        item.className = 'layer-item';
        item.draggable = true;
        item.dataset.index = realIndex;

        const label = document.createElement('span');
        label.textContent = layer.container.label;
        label.style.flex = '1';
        label.style.fontSize = "13px";
        label.style.color = layer.type === "adjustment" ? '#a78bfa' : '#e2e8f0';

        const toggle = document.createElement('button');
        toggle.textContent = '👁';
        toggle.title = 'Toggle visibility';
        toggle.onclick = () => {
            layer.container.visible = !layer.container.visible;
            toggle.style.opacity = layer.container.visible ? '1' : '0.3';
        };

        if (layer.type === "adjustment"){
            const blendSelect = document.createElement('select');
            blend_modes.forEach(mode => {
                const opt = document.createElement('option');
                opt.value = mode;
                opt.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
                if (mode===layer.blendMode){
                    opt.selected = true;
                    blendSelect.appendChild(opt);
                }
            });
            blendSelect.onchange = () =>{
                layer.blendMode = blendSelect.value;
                layer.sprite.blendMode = blendSelect.value;
            };
            item.appendChild(blendSelect);
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '🗑';
        deleteBtn.onclick = () =>{
            app.stage.removeChild(layer.container);
            layers.splice(realIndex,1);
            updateLayerUI(app,layers,panelId);
        };

        item.appendChild(label);
        item.appendChild(toggle);
        item.appendChild(deleteBtn);

        /* drag to move around layers */
        item.addEventListener('dragstart',()=>{
            dragSrcIndex = realIndex;
            item.style.opacity = '0.4';
        })

        item.addEventListener('dragend',()=>{
            item.style.opacty = "1";
        })

        item.addEventListener('dragover', (e)=>{
            e.preventDefault();
            item.style.outline = '2px solid #a78bfa';
        })

        item.addEventListener('drop',(e)=>{
            e.preventDefault();
            item.style.outline = 'none';
            if (dragSrcIndex === null || dragSrcIndex === realIndex) return;

            const moved = layers.splice(dragSrcIndex,1)[0];
            layers.splice(realIndex,0,moved);

            layers.forEach((l,i)=>{
                app.stage.setChildIndex(l.container,i);
            })
            dragSrcIndex = null;
            updateLayerUI(app,layers,panelId);
        })

        layerList.appendChild(item);
    })
}
    
export function createAdjustmentPanel(app,layers,updateLayerUIFn){
    const panel = document.createElement('div');
    panel.style.cssText = `
        background: #1e1e2e;
        border: 1px solid #313244;
        border-radius: 8px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        font-family: monospace;
        color: #cdd6f4;
        width: 220px;
    `;

    const title = document.createElement('div');
    title.textContent = "Add Gradient Map";
    title.style.cssText = 'font-size: 12px; font-weight: bold; color: #a78bfa; letter-spacing: 1px;';
    panel.appendChild(title);

    const presetLabeL = document.createElement('label');
    presetLabeL.textContent = "Preset";
    presetLabeL.style.fontSize = "11px";

    const presetSelect = document.createElement('select');
    presetSelect.style.cssText = 'width: 100%; background: #313244; color: #cdd6f4; border: none; padding: 4px; border-radius: 4px;';
    const blankOpt = document.createElement('option');
    blankOpt.value = '';
    blankOpt.textContent = '— choose preset —';
    presetSelect.appendChild(blankOpt);

    Object.keys(added_presets).forEach(name=>{
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        presetSelect.appendChild(opt);
    })
}