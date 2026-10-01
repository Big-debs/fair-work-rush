import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

function geometryFor(object) {
  if (['pot', 'bowl', 'plate', 'coins', 'clock'].includes(object)) {
    return new THREE.CylinderGeometry(object === 'plate' ? 1.05 : .75, object === 'bowl' ? .45 : .75, object === 'plate' ? .12 : .65, 24);
  }
  if (['bag', 'basket', 'care-bag'].includes(object)) return new THREE.BoxGeometry(1.2, 1, .8);
  if (['bed', 'care-mat', 'table', 'counter'].includes(object)) return new THREE.BoxGeometry(1.8, .35, 1.1);
  if (['sink', 'machine', 'stall', 'shelf', 'gate', 'door', 'sofa', 'cot'].includes(object)) return new THREE.BoxGeometry(1.35, 1.45, .75);
  if (['list', 'notebook', 'route'].includes(object)) return new THREE.BoxGeometry(.95, .08, 1.25);
  if (['brush', 'tray'].includes(object)) return new THREE.BoxGeometry(1.35, .16, .65);
  return new THREE.SphereGeometry(.72, 20, 14);
}

function createProp(step, index, count) {
  const material = new THREE.MeshStandardMaterial({
    color: step.color,
    roughness: .68,
    metalness: .05,
    emissive: 0x000000
  });
  const mesh = new THREE.Mesh(geometryFor(step.object), material);
  const spacing = Math.min(2.25, 7 / Math.max(1, count - 1));
  mesh.position.set((index - (count - 1) / 2) * spacing, 0, 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.stepIndex = index;
  mesh.userData.baseY = 0;
  return mesh;
}

export default function ThreeActivity({
  activity,
  acknowledgedStep,
  visible,
  reducedMotion,
  onStep,
  onFinish,
  onAbandon,
  onFallback
}) {
  const mountRef = useRef(null);
  const meshesRef = useRef([]);
  const visibleRef = useRef(visible);
  const reducedMotionRef = useRef(reducedMotion);
  const currentStepRef = useRef(acknowledgedStep + 1);
  const pendingRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [renderError, setRenderError] = useState('');
  const currentStep = acknowledgedStep + 1;
  const complete = currentStep >= activity.steps.length;

  useEffect(() => { visibleRef.current = visible; }, [visible]);
  useEffect(() => { reducedMotionRef.current = reducedMotion; }, [reducedMotion]);
  useEffect(() => {
    currentStepRef.current = currentStep;
    pendingRef.current = false;
    setPending(false);
    meshesRef.current.forEach((mesh, index) => {
      const done = index < currentStep;
      const active = index === currentStep;
      mesh.material.opacity = done ? .42 : 1;
      mesh.material.transparent = done;
      mesh.material.emissive.setHex(active ? 0x3a2612 : 0x000000);
      mesh.scale.setScalar(active ? 1.12 : 1);
    });
  }, [currentStep]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    let renderer;
    let animationFrame;
    let resizeObserver;

    try {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x18273c);
      scene.fog = new THREE.Fog(0x18273c, 10, 18);
      const camera = new THREE.PerspectiveCamera(42, 1, .1, 50);
      camera.position.set(0, 5.8, 9.4);
      camera.lookAt(0, .1, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.domElement.setAttribute('aria-label', `${activity.title} interactive 3D scene`);
      renderer.domElement.tabIndex = 0;
      mount.replaceChildren(renderer.domElement);

      scene.add(new THREE.HemisphereLight(0xffefd4, 0x26364c, 2.1));
      const keyLight = new THREE.DirectionalLight(0xffffff, 2.3);
      keyLight.position.set(4, 8, 5);
      keyLight.castShadow = true;
      scene.add(keyLight);

      const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xa87755, roughness: .9 });
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 10), floorMaterial);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -.82;
      floor.receiveShadow = true;
      scene.add(floor);

      const backWall = new THREE.Mesh(
        new THREE.PlaneGeometry(18, 8),
        new THREE.MeshStandardMaterial({ color: 0xe8d8bd, roughness: 1 })
      );
      backWall.position.set(0, 3, -3.2);
      scene.add(backWall);

      const rug = new THREE.Mesh(
        new THREE.CircleGeometry(4.6, 40),
        new THREE.MeshStandardMaterial({ color: 0x9e4938, roughness: 1 })
      );
      rug.rotation.x = -Math.PI / 2;
      rug.position.y = -.78;
      rug.scale.z = .42;
      scene.add(rug);

      const meshes = activity.steps.map((activityStep, index) => createProp(activityStep, index, activity.steps.length));
      meshes.forEach((mesh) => scene.add(mesh));
      meshesRef.current = meshes;
      meshes.forEach((mesh, index) => {
        const done = index < currentStepRef.current;
        const active = index === currentStepRef.current;
        mesh.material.opacity = done ? .42 : 1;
        mesh.material.transparent = done;
        mesh.material.emissive.setHex(active ? 0x3a2612 : 0x000000);
        mesh.scale.setScalar(active ? 1.12 : 1);
      });

      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      const selectFromPointer = (event) => {
        if (pendingRef.current || currentStepRef.current >= activity.steps.length) return;
        const bounds = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
        pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const selected = raycaster.intersectObjects(meshes, false)[0]?.object;
        if (selected?.userData.stepIndex === currentStepRef.current) {
          pendingRef.current = true;
          setPending(true);
          onStep(currentStepRef.current);
        }
      };
      renderer.domElement.addEventListener('pointerdown', selectFromPointer);

      const resize = () => {
        const width = Math.max(1, mount.clientWidth);
        const height = Math.max(1, mount.clientHeight);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
        renderer.render(scene, camera);
      };
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(mount);
      resize();

      const animate = (time) => {
        animationFrame = requestAnimationFrame(animate);
        if (!visibleRef.current) return;
        const active = meshes[currentStepRef.current];
        if (active && !reducedMotionRef.current) {
          active.rotation.y = Math.sin(time / 700) * .16;
          active.position.y = active.userData.baseY + Math.sin(time / 480) * .08;
        }
        renderer.render(scene, camera);
      };
      animationFrame = requestAnimationFrame(animate);

      return () => {
        cancelAnimationFrame(animationFrame);
        resizeObserver?.disconnect();
        renderer.domElement.removeEventListener('pointerdown', selectFromPointer);
        meshes.forEach((mesh) => {
          mesh.geometry.dispose();
          mesh.material.dispose();
        });
        floor.geometry.dispose();
        floor.material.dispose();
        backWall.geometry.dispose();
        backWall.material.dispose();
        rug.geometry.dispose();
        rug.material.dispose();
        renderer.dispose();
        mount.replaceChildren();
      };
    } catch (error) {
      console.error('Unable to create the Three.js activity scene:', error);
      setRenderError('This device could not start the 3D activity.');
      renderer?.dispose();
      return undefined;
    }
  }, [activity.id]);

  const requestCurrentStep = () => {
    if (pendingRef.current || complete) return;
    pendingRef.current = true;
    setPending(true);
    onStep(currentStep);
  };

  return (
    <section className={`three-activity${visible ? ' visible' : ' paused'}`} aria-hidden={!visible}>
      <div className="three-activity-card">
        <header>
          <div><span>{activity.context} · INTERACTIVE ACTIVITY</span><h2>{activity.title}</h2></div>
          <b>{Math.min(currentStep, activity.steps.length)} / {activity.steps.length}</b>
        </header>
        <div className="three-viewport" ref={mountRef} />
        <div className="activity-instructions">
          {renderError ? (
            <div className="activity-render-error"><p>{renderError}</p><button type="button" onClick={onFallback}>Continue in simple mode</button></div>
          ) : complete ? (
            <div className="activity-complete"><strong>Activity complete</strong><span>Return the completed task to the household timeline.</span></div>
          ) : (
            <>
              <span className="step-kicker">STEP {currentStep + 1}</span>
              <h3>{activity.steps[currentStep].label}</h3>
              <p>{activity.steps[currentStep].instruction}</p>
              <button type="button" disabled={pending} onClick={requestCurrentStep}>
                {pending ? 'Time is moving…' : `Use ${activity.steps[currentStep].object}`}
              </button>
            </>
          )}
        </div>
        <ol className="activity-steps">
          {activity.steps.map((item, index) => (
            <li key={item.id} className={index < currentStep ? 'done' : index === currentStep ? 'current' : ''}>
              <i>{index < currentStep ? '✓' : index + 1}</i><span>{item.label}</span>
            </li>
          ))}
        </ol>
        <footer>
          <button className="quiet" type="button" onClick={onAbandon}>Leave unfinished</button>
          <button className="quiet" type="button" onClick={onFallback}>Use simple mode</button>
          {complete && <button className="finish" type="button" onClick={onFinish}>Finish task</button>}
        </footer>
      </div>
    </section>
  );
}
