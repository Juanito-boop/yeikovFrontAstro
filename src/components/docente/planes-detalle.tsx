interface PlanesDetalleProps {
  id: string;
}

export default function PlanesDetalle({ id }: PlanesDetalleProps) {
  return (
    <div>
      <h1>Detalle del Plan de Mejoramiento: {id}</h1>
    </div>
  );
}