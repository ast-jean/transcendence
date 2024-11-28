/* global CANNON,THREE,Detector */
import * as THREE from 'three';
import * as CANNON from 'cannon';



class CannonDebugRenderer {
    constructor(scene, world, options = {}) {
        this.scene = scene;
        this.world = world;

        this._meshes = [];
        this._material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
    }

    update() {
        const bodies = this.world.bodies;
        const meshes = this._meshes;
        const shapeWorldPosition = new CANNON.Vec3();
        const shapeWorldQuaternion = new CANNON.Quaternion();

        let meshIndex = 0;

        for (let i = 0; i < bodies.length; i++) {
            const body = bodies[i];

            for (let j = 0; j < body.shapes.length; j++) {
                const shape = body.shapes[j];

                this._updateMesh(meshIndex, body, shape);

                const mesh = meshes[meshIndex];

                if (mesh) {
                    body.quaternion.vmult(body.shapeOffsets[j], shapeWorldPosition);
                    body.position.vadd(shapeWorldPosition, shapeWorldPosition);

                    body.quaternion.mult(body.shapeOrientations[j], shapeWorldQuaternion);

                    mesh.position.copy(shapeWorldPosition);
                    mesh.quaternion.copy(shapeWorldQuaternion);
                }

                meshIndex++;
            }
        }

        for (let k = meshIndex; k < meshes.length; k++) {
            this.scene.remove(meshes[k]);
        }

        meshes.length = meshIndex;
    }

    _updateMesh(index, body, shape) {
        let mesh = this._meshes[index];
        if (!this._typeMatch(mesh, shape)) {
            if (mesh) {
                this.scene.remove(mesh);
            }
            this._meshes[index] = this._createMesh(shape);
        }
    }

    _typeMatch(mesh, shape) {
        if (!mesh) {
            return false;
        }

        const geometry = mesh.geometry;
        return (geometry instanceof THREE.SphereGeometry && shape instanceof CANNON.Sphere) ||
            (geometry instanceof THREE.BoxGeometry && shape instanceof CANNON.Box) ||
            (geometry instanceof THREE.PlaneGeometry && shape instanceof CANNON.Plane);
    }

    _createMesh(shape) {
        let mesh;
        let geometry;
        let material = this._material;

        switch (shape.type) {
            case CANNON.Shape.types.SPHERE:
                geometry = new THREE.SphereGeometry(shape.radius, 8, 8);
                break;

            case CANNON.Shape.types.BOX:
                geometry = new THREE.BoxGeometry(shape.halfExtents.x * 2, shape.halfExtents.y * 2, shape.halfExtents.z * 2);
                break;

            case CANNON.Shape.types.PLANE:
                geometry = new THREE.PlaneGeometry(10, 10, 4, 4);
                material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true, side: THREE.DoubleSide });
                break;

            default:
                //console.log("Warning: Shape type not recognized.");
                return null;
        }

        mesh = new THREE.Mesh(geometry, material);
        this.scene.add(mesh);
        return mesh;
    }
}

export default CannonDebugRenderer;
