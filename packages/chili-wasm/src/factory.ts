import {
    ICompound,
    IEdge,
    IFace,
    IShape,
    IShapeConverter,
    IShapeFactory,
    ISolid,
    IVertex,
    IWire,
    MathUtils,
    Plane,
    Ray,
    Result,
    XYZ,
    XYZLike,
} from "chili-core";
import { ShapeResult, TopoDS_Shape } from "../lib/chili-wasm";
import { OccShapeConverter } from "./converter";
import { OcctHelper } from "./helper";
import { OccShape } from "./shape";

function ensureOccShape(shapes: IShape | IShape[]): TopoDS_Shape[] {
    if (Array.isArray(shapes)) {
        return shapes.map((x) => {
            if (!(x instanceof OccShape)) {
                throw new Error("The OCC kernel only supports OCC geometries.");
            }
            return x.shape;
        });
    }

    if (shapes instanceof OccShape) {
        return [shapes.shape];
    }

    throw new Error("The OCC kernel only supports OCC geometries.");
}

function convertShapeResult(result: ShapeResult): Result<IShape, string> {
    if (!result.isOk) {
        return Result.err(String(result.error));
    }
    return Result.ok(OcctHelper.wrapShape(result.shape));
}

export class ShapeFactory implements IShapeFactory {
    readonly kernelName = "opencascade";
    readonly converter: IShapeConverter;
    constructor() {
        this.converter = new OccShapeConverter();
    }

    face(wire: IWire[]): Result<IFace> {
        let shapes = ensureOccShape(wire);
        return convertShapeResult(wasm.ShapeFactory.face(shapes)) as Result<IFace>;
    }
    bezier(points: XYZLike[], weights?: number[]): Result<IEdge> {
        return convertShapeResult(wasm.ShapeFactory.bezier(points, weights ?? [])) as Result<IEdge>;
    }
    point(point: XYZLike): Result<IVertex> {
        return convertShapeResult(wasm.ShapeFactory.point(point)) as Result<IVertex>;
    }
    line(start: XYZLike, end: XYZLike): Result<IEdge> {
        if (MathUtils.allEqualZero(start.x - end.x, start.y - end.y, start.z - end.z)) {
            return Result.err("The start and end points are too close.");
        }

        return convertShapeResult(wasm.ShapeFactory.line(start, end)) as Result<IEdge>;
    }
    arc(normal: XYZLike, center: XYZLike, start: XYZLike, angle: number): Result<IEdge> {
        return convertShapeResult(
            wasm.ShapeFactory.arc(normal, center, start, MathUtils.degToRad(angle)),
        ) as Result<IEdge>;
    }
    circle(normal: XYZLike, center: XYZLike, radius: number): Result<IEdge> {
        return convertShapeResult(wasm.ShapeFactory.circle(normal, center, radius)) as Result<IEdge>;
    }
    rect(plane: Plane, dx: number, dy: number): Result<IFace> {
        return convertShapeResult(wasm.ShapeFactory.rect(OcctHelper.toAx3(plane), dx, dy)) as Result<IFace>;
    }
    polygon(points: XYZLike[]): Result<IWire> {
        return convertShapeResult(wasm.ShapeFactory.polygon(points)) as Result<IWire>;
    }
    box(plane: Plane, dx: number, dy: number, dz: number): Result<ISolid> {
        return convertShapeResult(
            wasm.ShapeFactory.box(OcctHelper.toAx3(plane), dx, dy, dz),
        ) as Result<ISolid>;
    }
    wire(edges: IEdge[]): Result<IWire> {
        return convertShapeResult(wasm.ShapeFactory.wire(ensureOccShape(edges))) as Result<IWire>;
    }
    prism(shape: IShape, vec: XYZ): Result<IShape> {
        if (vec.length() === 0) {
            return Result.err(`The vector length is 0, the prism cannot be created.`);
        }
        return convertShapeResult(wasm.ShapeFactory.prism(ensureOccShape(shape)[0], vec));
    }
    fuse(bottom: IShape, top: IShape): Result<IShape> {
        return convertShapeResult(
            wasm.ShapeFactory.booleanFuse(ensureOccShape(bottom), ensureOccShape(top)),
        );
    }
    sweep(profile: IShape, path: IWire): Result<IShape> {
        return convertShapeResult(
            wasm.ShapeFactory.sweep(ensureOccShape(profile)[0], ensureOccShape(path)[0]),
        );
    }
    revolve(profile: IShape, axis: Ray, angle: number): Result<IShape> {
        return convertShapeResult(
            wasm.ShapeFactory.revolve(ensureOccShape(profile)[0], axis, MathUtils.degToRad(angle)),
        );
    }
    booleanCommon(shape1: IShape, shape2: IShape): Result<IShape> {
        return convertShapeResult(
            wasm.ShapeFactory.booleanCommon(ensureOccShape(shape1), ensureOccShape(shape2)),
        );
    }
    booleanCut(shape1: IShape, shape2: IShape): Result<IShape> {
        return convertShapeResult(
            wasm.ShapeFactory.booleanCut(ensureOccShape(shape1), ensureOccShape(shape2)),
        );
    }
    booleanFuse(shape1: IShape, shape2: IShape): Result<IShape> {
        return convertShapeResult(
            wasm.ShapeFactory.booleanFuse(ensureOccShape(shape1), ensureOccShape(shape2)),
        );
    }
    combine(shapes: IShape[]): Result<ICompound> {
        return convertShapeResult(wasm.ShapeFactory.combine(ensureOccShape(shapes))) as Result<ICompound>;
    }
    makeThickSolidBySimple(shape: IShape, thickness: number): Result<IShape> {
        return convertShapeResult(
            wasm.ShapeFactory.makeThickSolidBySimple(ensureOccShape(shape)[0], thickness),
        );
    }
    makeThickSolidByJoin(shape: IShape, closingFaces: IShape[], thickness: number): Result<IShape> {
        return convertShapeResult(
            wasm.ShapeFactory.makeThickSolidByJoin(
                ensureOccShape(shape)[0],
                ensureOccShape(closingFaces),
                thickness,
            ),
        );
    }
}
