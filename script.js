import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.153.0/examples/jsm/loaders/GLTFLoader.js';
import { ARButton } from 'https://cdn.jsdelivr.net/npm/three@0.153.0/examples/jsm/webxr/ARButton.js';

let camera, scene, renderer, controller;

init();
animate();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera();

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  scene.add(light);

  const loader = new GLTFLoader();
  let reticle, model;

  const reticleGeometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);
  const reticleMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  loader.load('modelo.glb', function (gltf) {
    model = gltf.scene;
    model.scale.set(0.5, 0.5, 0.5);
    model.visible = false;
    scene.add(model);
  });

  renderer.xr.addEventListener('sessionstart', () => {
    renderer.xr.getSession().requestReferenceSpace('viewer').then((referenceSpace) => {
      renderer.xr.getSession().requestHitTestSource({ space: referenceSpace }).then((hitTestSource) => {
        controller = renderer.xr.getController(0);
        controller.addEventListener('select', () => {
          if (model && reticle.visible) {
            model.position.setFromMatrixPosition(reticle.matrix);
            model.visible = true;
          }
        });
        renderer.setAnimationLoop((timestamp, frame) => {
          if (frame) {
            const referenceSpace = renderer.xr.getReferenceSpace();
            const viewerPose = frame.getViewerPose(referenceSpace);
            if (viewerPose) {
              const hitTestResults = frame.getHitTestResults(hitTestSource);
              if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                const pose = hit.getPose(referenceSpace);
                reticle.visible = true;
                reticle.matrix.fromArray(pose.transform.matrix);
              } else {
                reticle.visible = false;
              }
            }
          }
          renderer.render(scene, camera);
        });
      });
    });
  });
}

function animate() {
  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });
}
