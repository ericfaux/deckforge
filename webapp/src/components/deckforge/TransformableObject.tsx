import { useRef, useEffect } from 'react';
import { Rect, Text, Circle, Star, RegularPolygon, Image as KonvaImage, Transformer } from 'react-konva';
import type Konva from 'konva';
import { CanvasObject } from '@/store/deckforge';
import useImage from 'use-image';

interface TransformableObjectProps {
  obj: CanvasObject;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updates: Partial<CanvasObject>) => void;
  onDragEnd: () => void;
  onTransformEnd: () => void;
}

function ImageObject({ obj, ...props }: { obj: CanvasObject } & Omit<TransformableObjectProps, 'obj'>) {
  const [image] = useImage(obj.src || '');
  const shapeRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (props.isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [props.isSelected]);

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        image={image}
        x={obj.x}
        y={obj.y}
        width={obj.width}
        height={obj.height}
        rotation={obj.rotation}
        opacity={obj.opacity}
        scaleX={obj.scaleX}
        scaleY={obj.scaleY}
        draggable
        onClick={props.onSelect}
        onTap={props.onSelect}
        onDragEnd={(e) => {
          props.onChange({
            x: e.target.x(),
            y: e.target.y(),
          });
          props.onDragEnd();
        }}
        onTransformEnd={() => {
          const node = shapeRef.current;
          if (!node) return;
          props.onChange({
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            scaleX: node.scaleX(),
            scaleY: node.scaleY(),
          });
          props.onTransformEnd();
        }}
      />
      {props.isSelected && (
        <Transformer
          ref={trRef}
          anchorSize={8}
          anchorCornerRadius={0}
          anchorFill="#ccff00"
          anchorStroke="#ccff00"
          borderStroke="#ccff00"
          borderStrokeWidth={1}
          rotateAnchorOffset={20}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
        />
      )}
    </>
  );
}

function TextObject({ obj, ...props }: { obj: CanvasObject } & Omit<TransformableObjectProps, 'obj'>) {
  const shapeRef = useRef<Konva.Text>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (props.isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [props.isSelected]);

  return (
    <>
      <Text
        ref={shapeRef}
        x={obj.x}
        y={obj.y}
        text={obj.text || 'Text'}
        fontSize={obj.fontSize || 24}
        fontFamily={obj.fontFamily || 'Oswald'}
        fill={obj.fill || '#ffffff'}
        rotation={obj.rotation}
        opacity={obj.opacity}
        scaleX={obj.scaleX}
        scaleY={obj.scaleY}
        draggable
        onClick={props.onSelect}
        onTap={props.onSelect}
        onDragEnd={(e) => {
          props.onChange({
            x: e.target.x(),
            y: e.target.y(),
          });
          props.onDragEnd();
        }}
        onTransformEnd={() => {
          const node = shapeRef.current;
          if (!node) return;
          props.onChange({
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            scaleX: node.scaleX(),
            scaleY: node.scaleY(),
          });
          props.onTransformEnd();
        }}
      />
      {props.isSelected && (
        <Transformer
          ref={trRef}
          anchorSize={8}
          anchorCornerRadius={0}
          anchorFill="#ccff00"
          anchorStroke="#ccff00"
          borderStroke="#ccff00"
          borderStrokeWidth={1}
          rotateAnchorOffset={20}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
        />
      )}
    </>
  );
}

function ShapeObject({ obj, ...props }: { obj: CanvasObject } & Omit<TransformableObjectProps, 'obj'>) {
  const shapeRef = useRef<Konva.Rect | Konva.Circle | Konva.Star>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (props.isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [props.isSelected]);

  const commonProps = {
    x: obj.x,
    y: obj.y,
    rotation: obj.rotation,
    opacity: obj.opacity,
    scaleX: obj.scaleX,
    scaleY: obj.scaleY,
    fill: obj.fill || '#ffffff',
    draggable: true,
    onClick: props.onSelect,
    onTap: props.onSelect,
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
      props.onChange({
        x: e.target.x(),
        y: e.target.y(),
      });
      props.onDragEnd();
    },
    onTransformEnd: () => {
      const node = shapeRef.current;
      if (!node) return;
      props.onChange({
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
      });
      props.onTransformEnd();
    },
  };

  const renderShape = () => {
    switch (obj.shapeType) {
      case 'circle':
        return (
          <Circle
            ref={shapeRef as React.RefObject<Konva.Circle>}
            {...commonProps}
            radius={obj.width / 2}
          />
        );
      case 'star':
        return (
          <Star
            ref={shapeRef as React.RefObject<Konva.Star>}
            {...commonProps}
            numPoints={5}
            innerRadius={obj.width / 4}
            outerRadius={obj.width / 2}
          />
        );
      case 'polygon':
        return (
          <RegularPolygon
            ref={shapeRef as React.RefObject<Konva.RegularPolygon>}
            {...commonProps}
            sides={obj.polygonSides || 6}
            radius={obj.width / 2}
          />
        );
      default:
        return (
          <Rect
            ref={shapeRef as React.RefObject<Konva.Rect>}
            {...commonProps}
            width={obj.width}
            height={obj.height}
          />
        );
    }
  };

  return (
    <>
      {renderShape()}
      {props.isSelected && (
        <Transformer
          ref={trRef}
          anchorSize={8}
          anchorCornerRadius={0}
          anchorFill="#ccff00"
          anchorStroke="#ccff00"
          borderStroke="#ccff00"
          borderStrokeWidth={1}
          rotateAnchorOffset={20}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
        />
      )}
    </>
  );
}

export function TransformableObject(props: TransformableObjectProps) {
  const { obj, isSelected, onSelect, onChange, onDragEnd, onTransformEnd } = props;

  switch (obj.type) {
    case 'image':
      return <ImageObject obj={obj} isSelected={isSelected} onSelect={onSelect} onChange={onChange} onDragEnd={onDragEnd} onTransformEnd={onTransformEnd} />;
    case 'text':
      return <TextObject obj={obj} isSelected={isSelected} onSelect={onSelect} onChange={onChange} onDragEnd={onDragEnd} onTransformEnd={onTransformEnd} />;
    case 'shape':
      return <ShapeObject obj={obj} isSelected={isSelected} onSelect={onSelect} onChange={onChange} onDragEnd={onDragEnd} onTransformEnd={onTransformEnd} />;
    default:
      return null;
  }
}
