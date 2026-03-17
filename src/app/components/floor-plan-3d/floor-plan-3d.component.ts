import {
    Component, OnInit, OnDestroy, OnChanges, SimpleChanges,
    Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit, NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

@Component({
    selector: 'app-floor-plan-3d',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './floor-plan-3d.component.html',
    styleUrl: './floor-plan-3d.component.css'
})
export class FloorPlan3DComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
    @Input() tables: any[] = [];
    @Input() mode: 'admin' | 'customer' = 'customer';
    @Input() floors: number[] = [1];
    @Input() selectedFloor: number = 1;
    @Input() selectedTableId: number | null = null;

    @Output() tableSelected = new EventEmitter<any>();
    @Output() tableMoved = new EventEmitter<any>();
    @Output() floorChanged = new EventEmitter<number>();

    @ViewChild('canvas3d', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

    private renderer!: THREE.WebGLRenderer;
    private scene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera;
    private controls!: OrbitControls;
    private raycaster = new THREE.Raycaster();
    private mouse = new THREE.Vector2();
    private tableMeshes: THREE.Group[] = [];
    private groundPlane!: THREE.Mesh;
    private animationId!: number;

    // Drag state
    private isDragging = false;
    private dragTarget: THREE.Group | null = null;
    private dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    private dragOffset = new THREE.Vector3();
    private intersection = new THREE.Vector3();

    // Color palette
    private readonly COLORS = {
        available: 0x00e676,
        booked: 0xff5252,
        noCapacity: 0x757575,
        selected: 0xffd740,
        ground: 0x1a1a2e,
        gridLine: 0x2a2a4a,
        tableTop: 0x3a3a5c,
        chair: 0x5c5c8a,
        ambient: 0x6060a0,
        directional: 0xffffff
    };

    constructor(private ngZone: NgZone) { }

    ngOnInit() { }

    ngAfterViewInit() {
        this.initScene();
        this.buildFloor();
        this.renderTables();
        this.animate();
        window.addEventListener('resize', this.onResize);
    }

    ngOnChanges(changes: SimpleChanges) {
        if (!this.scene) return;
        if (changes['tables'] || changes['selectedTableId'] || changes['selectedFloor']) {
            this.renderTables();
        }
    }

    ngOnDestroy() {
        window.removeEventListener('resize', this.onResize);
        cancelAnimationFrame(this.animationId);
        this.renderer?.dispose();
        this.controls?.dispose();
    }

    selectFloor(floor: number) {
        this.floorChanged.emit(floor);
    }

    // ───── Scene Setup ─────

    private initScene() {
        const canvas = this.canvasRef.nativeElement;
        const w = canvas.parentElement!.clientWidth;
        const h = canvas.parentElement!.clientHeight || 500;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0d0d1a);
        this.scene.fog = new THREE.FogExp2(0x0d0d1a, 0.0015);

        // Camera — perspective with isometric-like angle
        this.camera = new THREE.PerspectiveCamera(45, w / h, 1, 5000);
        this.camera.position.set(400, 500, 400);
        this.camera.lookAt(250, 0, 200);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        this.renderer.setSize(w, h);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Orbit controls (admin can rotate freely, customer limited)
        this.controls = new OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.target.set(250, 0, 200);
        this.controls.maxPolarAngle = Math.PI / 2.3;
        this.controls.minDistance = 150;
        this.controls.maxDistance = 1200;

        // Lighting
        const ambientLight = new THREE.AmbientLight(this.COLORS.ambient, 0.6);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(this.COLORS.directional, 0.8);
        dirLight.position.set(300, 600, 300);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.set(2048, 2048);
        dirLight.shadow.camera.near = 1;
        dirLight.shadow.camera.far = 2000;
        dirLight.shadow.camera.left = -600;
        dirLight.shadow.camera.right = 600;
        dirLight.shadow.camera.top = 600;
        dirLight.shadow.camera.bottom = -600;
        this.scene.add(dirLight);

        const pointLight = new THREE.PointLight(0x4040ff, 0.3, 1000);
        pointLight.position.set(250, 200, 200);
        this.scene.add(pointLight);

        // Mouse events
        canvas.addEventListener('pointerdown', this.onPointerDown);
        canvas.addEventListener('pointermove', this.onPointerMove);
        canvas.addEventListener('pointerup', this.onPointerUp);
    }

    private buildFloor() {
        // Ground plane
        const groundGeo = new THREE.PlaneGeometry(800, 600);
        const groundMat = new THREE.MeshStandardMaterial({
            color: this.COLORS.ground,
            roughness: 0.9,
            metalness: 0.1,
        });
        this.groundPlane = new THREE.Mesh(groundGeo, groundMat);
        this.groundPlane.rotation.x = -Math.PI / 2;
        this.groundPlane.position.set(250, -1, 200);
        this.groundPlane.receiveShadow = true;
        this.scene.add(this.groundPlane);

        // Grid helper
        const grid = new THREE.GridHelper(800, 20, this.COLORS.gridLine, this.COLORS.gridLine);
        grid.position.set(250, 0, 200);
        (grid.material as THREE.Material).opacity = 0.3;
        (grid.material as THREE.Material).transparent = true;
        this.scene.add(grid);

        // Floor label text (using a simple sprite)
        this.addFloorLabel();
    }

    private addFloorLabel() {
        // Remove old label if exists
        const oldLabel = this.scene.getObjectByName('floorLabel');
        if (oldLabel) this.scene.remove(oldLabel);
    }

    // ───── Table Rendering ─────

    renderTables() {
        // Clear old meshes
        this.tableMeshes.forEach(m => this.scene.remove(m));
        this.tableMeshes = [];

        const floorTables = this.tables.filter(t => (t.floorNumber || 1) === this.selectedFloor);

        floorTables.forEach(table => {
            const group = this.createTableMesh(table);
            group.position.set(table.posX || 0, 0, table.posY || 0);
            group.rotation.y = ((table.rotation || 0) * Math.PI) / 180;
            group.userData = { ...table };
            this.scene.add(group);
            this.tableMeshes.push(group);
        });
    }

    private createTableMesh(table: any): THREE.Group {
        const group = new THREE.Group();
        group.name = `table_${table.tableId}`;

        const isSelected = table.tableId === this.selectedTableId;
        const isBooked = table.isBooked === true;
        const hasCapacity = table.hasCapacity !== false;

        let color = this.COLORS.available;
        if (isSelected) color = this.COLORS.selected;
        else if (isBooked) color = this.COLORS.booked;
        else if (!hasCapacity && this.mode === 'customer') color = this.COLORS.noCapacity;

        const shape = table.shape || 'round';
        const capacity = table.capacity || 2;

        // Table Legs
        const legMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3e, roughness: 0.5, metalness: 0.5 });
        const legGeo = new THREE.CylinderGeometry(2, 2, 20, 8);

        // Table Top
        let tableTopGeo: THREE.BufferGeometry;
        let tableW = 25 + capacity * 4;
        let tableD = 25 + capacity * 4;

        if (shape === 'round') {
            tableTopGeo = new THREE.CylinderGeometry(tableW / 2, tableW / 2, 3, 32);
        } else if (shape === 'rectangle') {
            tableW = 30 + capacity * 5;
            tableD = 20 + capacity * 3;
            tableTopGeo = new THREE.BoxGeometry(tableW, 3, tableD);
        } else {
            tableTopGeo = new THREE.BoxGeometry(tableW, 3, tableD);
        }

        const tableTopMat = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.3,
            metalness: 0.4,
            emissive: new THREE.Color(color),
            emissiveIntensity: isSelected ? 0.4 : 0.1,
        });

        const tableTop = new THREE.Mesh(tableTopGeo, tableTopMat);
        tableTop.position.y = 22;
        tableTop.castShadow = true;
        tableTop.receiveShadow = true;
        group.add(tableTop);

        // Four legs
        const legPositions = shape === 'round'
            ? [
                [tableW / 3, 0, tableW / 3],
                [-tableW / 3, 0, tableW / 3],
                [tableW / 3, 0, -tableW / 3],
                [-tableW / 3, 0, -tableW / 3],
            ]
            : [
                [tableW / 2 - 3, 0, tableD / 2 - 3],
                [-tableW / 2 + 3, 0, tableD / 2 - 3],
                [tableW / 2 - 3, 0, -tableD / 2 + 3],
                [-tableW / 2 + 3, 0, -tableD / 2 + 3],
            ];

        legPositions.forEach(([x, _, z]) => {
            const leg = new THREE.Mesh(legGeo, legMat);
            leg.position.set(x, 10, z);
            leg.castShadow = true;
            group.add(leg);
        });

        // Chairs
        const chairCount = Math.min(capacity, 8);
        const chairMat = new THREE.MeshStandardMaterial({ color: this.COLORS.chair, roughness: 0.5, metalness: 0.3 });

        if (shape === 'round') {
            for (let i = 0; i < chairCount; i++) {
                const angle = (i / chairCount) * Math.PI * 2;
                const radius = tableW / 2 + 12;
                const chair = this.createChair(chairMat);
                chair.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
                chair.rotation.y = angle + Math.PI;
                group.add(chair);
            }
        } else {
            const perSide = Math.ceil(chairCount / 2);
            for (let i = 0; i < perSide; i++) {
                const xOff = -tableW / 2 + (tableW / (perSide + 1)) * (i + 1);
                // Front
                const ch1 = this.createChair(chairMat);
                ch1.position.set(xOff, 0, tableD / 2 + 12);
                ch1.rotation.y = Math.PI;
                group.add(ch1);
                // Back (if we have capacity)
                if (i + perSide < chairCount) {
                    const ch2 = this.createChair(chairMat);
                    ch2.position.set(xOff, 0, -tableD / 2 - 12);
                    group.add(ch2);
                }
            }
        }

        // Label sprite
        const label = this.createLabel(table.tableLabel || 'T', capacity);
        label.position.set(0, 36, 0);
        group.add(label);

        // Glow ring for selected
        if (isSelected) {
            const glowGeo = shape === 'round'
                ? new THREE.RingGeometry(tableW / 2 + 8, tableW / 2 + 12, 32)
                : new THREE.RingGeometry(tableW / 2 + 8, tableW / 2 + 12, 4);
            const glowMat = new THREE.MeshBasicMaterial({ color: this.COLORS.selected, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            glow.rotation.x = -Math.PI / 2;
            glow.position.y = 1;
            group.add(glow);
        }

        return group;
    }

    private createChair(mat: THREE.MeshStandardMaterial): THREE.Group {
        const chair = new THREE.Group();
        // Seat
        const seatGeo = new THREE.BoxGeometry(8, 2, 8);
        const seat = new THREE.Mesh(seatGeo, mat);
        seat.position.y = 12;
        seat.castShadow = true;
        chair.add(seat);
        // Backrest
        const backGeo = new THREE.BoxGeometry(8, 10, 2);
        const back = new THREE.Mesh(backGeo, mat);
        back.position.set(0, 18, -3);
        back.castShadow = true;
        chair.add(back);
        // Legs
        const legGeo = new THREE.CylinderGeometry(1, 1, 12, 6);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.6, metalness: 0.4 });
        [[-3, 0, -3], [3, 0, -3], [-3, 0, 3], [3, 0, 3]].forEach(([x, _, z]) => {
            const leg = new THREE.Mesh(legGeo, legMat);
            leg.position.set(x, 6, z);
            chair.add(leg);
        });
        return chair;
    }

    private createLabel(text: string, capacity: number): THREE.Sprite {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.roundRect(4, 4, 120, 56, 12);
        ctx.fill();

        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(text, 64, 32);

        ctx.font = '16px Arial';
        ctx.fillStyle = '#aaaacc';
        ctx.fillText(`${capacity}p`, 64, 52);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(40, 20, 1);
        return sprite;
    }

    // ───── Mouse Interaction ─────

    private onPointerDown = (event: PointerEvent) => {
        this.updateMouse(event);
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const meshes = this.tableMeshes.map(g => g.children).flat();
        const intersects = this.raycaster.intersectObjects(meshes, true);

        if (intersects.length > 0) {
            let obj = intersects[0].object;
            // Walk up to find the table group
            while (obj.parent && !obj.name.startsWith('table_')) {
                obj = obj.parent as THREE.Object3D;
            }
            if (obj.name.startsWith('table_')) {
                const tableData = obj.userData;

                if (this.mode === 'customer') {
                    // Customer mode: just select
                    if (!tableData['isBooked'] && tableData['hasCapacity'] !== false) {
                        this.tableSelected.emit(tableData);
                    }
                } else {
                    // Admin mode: start drag
                    this.isDragging = true;
                    this.dragTarget = obj as THREE.Group;
                    this.controls.enabled = false;

                    // Find intersection on the ground plane
                    this.raycaster.ray.intersectPlane(this.dragPlane, this.intersection);
                    this.dragOffset.copy(this.intersection).sub(this.dragTarget.position);

                    this.tableSelected.emit(tableData);
                }
            }
        }
    };

    private onPointerMove = (event: PointerEvent) => {
        if (!this.isDragging || !this.dragTarget) return;

        this.updateMouse(event);
        this.raycaster.setFromCamera(this.mouse, this.camera);

        if (this.raycaster.ray.intersectPlane(this.dragPlane, this.intersection)) {
            const newX = this.intersection.x - this.dragOffset.x;
            const newZ = this.intersection.z - this.dragOffset.z;

            // Clamp to ground bounds
            this.dragTarget.position.x = Math.max(-50, Math.min(550, newX));
            this.dragTarget.position.z = Math.max(-50, Math.min(450, newZ));
        }
    };

    private onPointerUp = () => {
        if (this.isDragging && this.dragTarget) {
            const data = this.dragTarget.userData;
            data['posX'] = Math.round(this.dragTarget.position.x);
            data['posY'] = Math.round(this.dragTarget.position.z);
            this.tableMoved.emit(data);
        }
        this.isDragging = false;
        this.dragTarget = null;
        this.controls.enabled = true;
    };

    private updateMouse(event: PointerEvent) {
        const canvas = this.canvasRef.nativeElement;
        const rect = canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    // ───── Animation Loop ─────

    private animate = () => {
        this.animationId = requestAnimationFrame(this.animate);
        this.controls.update();

        // Animate selected table glow
        const time = Date.now() * 0.003;
        this.tableMeshes.forEach(group => {
            if (group.userData['tableId'] === this.selectedTableId) {
                group.children.forEach(child => {
                    if (child instanceof THREE.Mesh && child.geometry instanceof THREE.RingGeometry) {
                        (child.material as THREE.MeshBasicMaterial).opacity = 0.3 + Math.sin(time) * 0.2;
                    }
                });
            }
        });

        this.renderer.render(this.scene, this.camera);
    };

    private onResize = () => {
        const canvas = this.canvasRef.nativeElement;
        const parent = canvas.parentElement!;
        const w = parent.clientWidth;
        const h = parent.clientHeight || 500;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    };
}
