import { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Tag } from 'primereact/tag';
import { Toolbar } from 'primereact/toolbar';
import { FilterMatchMode } from 'primereact/api';
import { movimientoService, productoService, bodegaService } from '../services';

function Movimientos() {
  const toast = useRef(null);
  const [movimientos, setMovimientos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [bodegas, setBodegas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const [formData, setFormData] = useState({
    tipo: '',
    producto: null,
    bodegaOrigen: null,
    bodegaDestino: null,
    cantidad: 0,
    motivoMovimiento: '',
    documentoReferencia: '',
    observaciones: '',
  });

  const tiposMovimiento = [
    { label: 'Entrada', value: 'entrada' },
    { label: 'Salida', value: 'salida' },
    { label: 'Transferencia', value: 'transferencia' },
  ];

  const motivosMovimiento = [
    { label: 'Compra', value: 'compra' },
    { label: 'Devolución', value: 'devolucion' },
    { label: 'Ajuste de inventario', value: 'ajuste_inventario' },
    { label: 'Venta', value: 'venta' },
    { label: 'Daño', value: 'daño' },
    { label: 'Vencimiento', value: 'vencimiento' },
    { label: 'Transferencia entre bodegas', value: 'transferencia_bodegas' },
    { label: 'Otro', value: 'otro' },
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [respMovimientos, respProductos, respBodegas] = await Promise.all([
        movimientoService.obtenerTodos({ limit: 100 }),
        productoService.obtenerTodos({ activo: true, limit: 100 }),
        bodegaService.obtenerTodas({ activo: true }),
      ]);

      if (respMovimientos.success) {
        setMovimientos(respMovimientos.data.movimientos);
      }
      if (respProductos.success) {
        setProductos(respProductos.data.productos);
      }
      if (respBodegas.success) {
        setBodegas(respBodegas.data.bodegas);
      }
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los datos',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    resetFormulario();
    setShowDialog(true);
  };

  const resetFormulario = () => {
    setFormData({
      tipo: '',
      producto: null,
      bodegaOrigen: null,
      bodegaDestino: null,
      cantidad: 0,
      motivoMovimiento: '',
      documentoReferencia: '',
      observaciones: '',
    });
  };

  const handleSubmit = async () => {
    if (
      !formData.tipo ||
      !formData.producto ||
      !formData.cantidad ||
      !formData.motivoMovimiento
    ) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validación',
        detail:
          'Complete los campos requeridos (tipo, producto, cantidad, motivo)',
        life: 3000,
      });
      return;
    }

    // Validación adicional para transferencias
    if (formData.tipo === 'transferencia') {
      if (!formData.bodegaOrigen || !formData.bodegaDestino) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Validación',
          detail: 'Las transferencias requieren bodega de origen y destino',
          life: 3000,
        });
        return;
      }
      if (formData.bodegaOrigen === formData.bodegaDestino) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Validación',
          detail: 'La bodega de origen y destino no pueden ser la misma',
          life: 3000,
        });
        return;
      }
    }

    setLoading(true);
    try {
      const response = await movimientoService.crear(formData);

      if (response.success) {
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Movimiento registrado correctamente',
          life: 3000,
        });
        setShowDialog(false);
        cargarDatos();
      }
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail:
          error.response?.data?.message || 'Error al registrar el movimiento',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Templates
  const tipoTemplate = (rowData) => {
    const tipoConfig = {
      entrada: {
        label: 'Entrada',
        severity: 'success',
        icon: 'pi pi-arrow-down',
      },
      salida: { label: 'Salida', severity: 'warning', icon: 'pi pi-arrow-up' },
      transferencia: {
        label: 'Transferencia',
        severity: 'info',
        icon: 'pi pi-arrows-h',
      },
    };
    const config = tipoConfig[rowData.tipo] || tipoConfig.entrada;
    return (
      <Tag value={config.label} severity={config.severity} icon={config.icon} />
    );
  };

  const fechaTemplate = (rowData) => {
    return new Date(rowData.fecha).toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const productoTemplate = (rowData) => {
    return (
      <div>
        <div className="font-semibold">{rowData.producto?.nombre}</div>
        <div
          className="text-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {rowData.producto?.codigo}
        </div>
      </div>
    );
  };

  const cantidadTemplate = (rowData) => {
    return (
      <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>
        {rowData.cantidad}
      </span>
    );
  };

  const bodegaTemplate = (rowData) => {
    // Para transferencias mostrar origen -> destino
    if (rowData.tipo === 'transferencia') {
      return (
        <div>
          <div className="text-sm">
            <span className="font-semibold">De:</span>{' '}
            {rowData.bodegaOrigen?.nombre || 'N/A'}
          </div>
          <div className="text-sm">
            <span className="font-semibold">A:</span>{' '}
            {rowData.bodegaDestino?.nombre || 'N/A'}
          </div>
        </div>
      );
    }
    // Para entradas/salidas mostrar bodega del producto
    return (
      rowData.producto?.bodega?.nombre ||
      rowData.bodegaOrigen?.nombre ||
      rowData.bodegaDestino?.nombre ||
      'N/A'
    );
  };

  const usuarioTemplate = (rowData) => {
    return (
      <div>
        <div className="font-semibold">
          {rowData.usuario_responsable?.nombre || 'N/A'}
        </div>
        <div
          className="text-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {rowData.usuario_responsable?.email || ''}
        </div>
      </div>
    );
  };

  const leftToolbarTemplate = () => {
    return (
      <Button
        label="Registrar Movimiento"
        icon="pi pi-plus"
        severity="success"
        onClick={abrirDialogoNuevo}
      />
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <div className="w-full md:w-auto">
        <span
          className="p-input-icon-left w-full"
          style={{ position: 'relative', display: 'inline-block' }}
        >
          <i
            className="pi pi-search"
            style={{
              position: 'absolute',
              left: '12px',
              top: '65%',
              transform: 'translateY(-50%)',
              color: '#6b7280',
            }}
          />
          <InputText
            value={globalFilter}
            onChange={(e) => {
              setGlobalFilter(e.target.value);
              setFilters({
                global: {
                  value: e.target.value,
                  matchMode: FilterMatchMode.CONTAINS,
                },
              });
            }}
            placeholder="Buscar..."
            className="w-full md:w-64"
            style={{ paddingLeft: '36px' }}
          />
        </span>
      </div>
    );
  };

  const dialogFooter = (
    <div>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        outlined
        onClick={() => setShowDialog(false)}
      />
      <Button
        label="Registrar"
        icon="pi pi-check"
        loading={loading}
        onClick={handleSubmit}
      />
    </div>
  );

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <ConfirmDialog />

      <Card
        title="Gestión de Movimientos"
        className="shadow-lg"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <Toolbar
          left={leftToolbarTemplate}
          right={rightToolbarTemplate}
          className="mb-4"
          style={{
            backgroundColor: 'var(--color-accent)',
            border: '1px solid var(--color-border)',
          }}
        />

        <DataTable
          value={movimientos}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          filters={filters}
          globalFilterFields={[
            'tipo',
            'referencia',
            'producto.nombre',
            'bodega.nombre',
          ]}
          emptyMessage="No se encontraron movimientos"
          stripedRows
          style={{ border: '1px solid var(--color-border)' }}
        >
          <Column
            field="fecha"
            header="Fecha"
            body={fechaTemplate}
            sortable
            style={{ minWidth: '150px' }}
          />
          <Column
            field="tipo"
            header="Tipo"
            body={tipoTemplate}
            sortable
            style={{ minWidth: '120px' }}
          />
          <Column
            field="producto"
            header="Producto"
            body={productoTemplate}
            style={{ minWidth: '200px' }}
          />
          <Column
            header="Bodega"
            body={bodegaTemplate}
            style={{ minWidth: '180px' }}
          />
          <Column
            field="cantidad"
            header="Cantidad"
            body={cantidadTemplate}
            sortable
            style={{ minWidth: '100px' }}
          />
          <Column
            field="motivoMovimiento"
            header="Motivo"
            sortable
            style={{ minWidth: '150px' }}
          />
          <Column
            field="documentoReferencia"
            header="Referencia"
            sortable
            style={{ minWidth: '150px' }}
          />
          <Column
            header="Usuario"
            body={usuarioTemplate}
            style={{ minWidth: '180px' }}
          />
        </DataTable>
      </Card>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header="Registrar Movimiento"
        modal
        style={{ width: '600px' }}
        footer={dialogFooter}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-1">
            <label
              className="block mb-2 font-semibold"
              style={{ color: 'var(--color-secondary)' }}
            >
              Tipo de Movimiento *
            </label>
            <Dropdown
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.value })}
              options={tiposMovimiento}
              placeholder="Seleccione"
              className="w-full"
            />
          </div>

          <div className="col-span-1">
            <label
              className="block mb-2 font-semibold"
              style={{ color: 'var(--color-secondary)' }}
            >
              Motivo *
            </label>
            <Dropdown
              value={formData.motivoMovimiento}
              onChange={(e) =>
                setFormData({ ...formData, motivoMovimiento: e.value })
              }
              options={motivosMovimiento}
              placeholder="Seleccione"
              className="w-full"
            />
          </div>

          {/* Bodega Origen - solo para salidas y transferencias */}
          {(formData.tipo === 'salida' ||
            formData.tipo === 'transferencia') && (
            <div className="col-span-1">
              <label
                className="block mb-2 font-semibold"
                style={{ color: 'var(--color-secondary)' }}
              >
                Bodega Origen {formData.tipo === 'transferencia' ? '*' : ''}
              </label>
              <Dropdown
                value={formData.bodegaOrigen}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bodegaOrigen: e.value,
                    producto: null,
                  })
                }
                options={bodegas.map((b) => ({
                  label: b.nombre,
                  value: b._id,
                }))}
                placeholder="Seleccione"
                className="w-full"
              />
            </div>
          )}

          {/* Bodega Destino - solo para entradas y transferencias */}
          {(formData.tipo === 'entrada' ||
            formData.tipo === 'transferencia') && (
            <div className="col-span-1">
              <label
                className="block mb-2 font-semibold"
                style={{ color: 'var(--color-secondary)' }}
              >
                Bodega Destino {formData.tipo === 'transferencia' ? '*' : ''}
              </label>
              <Dropdown
                value={formData.bodegaDestino}
                onChange={(e) =>
                  setFormData({ ...formData, bodegaDestino: e.value })
                }
                options={bodegas.map((b) => ({
                  label: b.nombre,
                  value: b._id,
                }))}
                placeholder="Seleccione"
                className="w-full"
              />
            </div>
          )}

          <div className="col-span-2">
            <label
              className="block mb-2 font-semibold"
              style={{ color: 'var(--color-secondary)' }}
            >
              Producto *{' '}
              {(formData.tipo === 'salida' ||
                formData.tipo === 'transferencia') &&
                !formData.bodegaOrigen && (
                  <span className="text-gray-400 text-sm">
                    (seleccione bodega origen primero)
                  </span>
                )}
            </label>
            <Dropdown
              value={formData.producto}
              onChange={(e) => setFormData({ ...formData, producto: e.value })}
              options={
                // Filtrar productos por bodega de origen para salidas y transferencias
                formData.tipo === 'salida' || formData.tipo === 'transferencia'
                  ? productos
                      .filter(
                        (p) =>
                          p.bodega?._id === formData.bodegaOrigen ||
                          p.bodega === formData.bodegaOrigen,
                      )
                      .map((p) => ({
                        label: `${p.nombre} (${p.codigo}) - Stock: ${p.stock_actual}`,
                        value: p._id,
                      }))
                  : productos.map((p) => ({
                      label: `${p.nombre} (${p.codigo})`,
                      value: p._id,
                    }))
              }
              placeholder={
                (formData.tipo === 'salida' ||
                  formData.tipo === 'transferencia') &&
                !formData.bodegaOrigen
                  ? 'Primero seleccione bodega origen'
                  : 'Seleccione'
              }
              filter
              className="w-full"
              disabled={
                (formData.tipo === 'salida' ||
                  formData.tipo === 'transferencia') &&
                !formData.bodegaOrigen
              }
              emptyMessage="No hay productos en esta bodega"
            />
          </div>

          <div className="col-span-1">
            <label
              className="block mb-2 font-semibold"
              style={{ color: 'var(--color-secondary)' }}
            >
              Cantidad *
            </label>
            <InputNumber
              value={formData.cantidad}
              onValueChange={(e) =>
                setFormData({ ...formData, cantidad: e.value })
              }
              className="w-full"
              min={1}
            />
          </div>

          <div className="col-span-1">
            <label
              className="block mb-2 font-semibold"
              style={{ color: 'var(--color-secondary)' }}
            >
              Documento de Referencia
            </label>
            <InputText
              value={formData.documentoReferencia}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  documentoReferencia: e.target.value,
                })
              }
              className="w-full"
              placeholder="Ej: FACTURA-001"
            />
          </div>

          <div className="col-span-2">
            <label
              className="block mb-2 font-semibold"
              style={{ color: 'var(--color-secondary)' }}
            >
              Observaciones
            </label>
            <InputTextarea
              value={formData.observaciones}
              onChange={(e) =>
                setFormData({ ...formData, observaciones: e.target.value })
              }
              className="w-full"
              rows={3}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default Movimientos;
