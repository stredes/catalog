import { useState, useEffect } from 'react';
import { Pressable, TextInput, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '../../../../shared/presentation/components/Icon';
import { useDependencies } from '../../../../bootstrap/dependencies';
import { useAppNavigation } from '../../../../bootstrap/navigation';
import { BottomMenu } from '../../../../shared/presentation/components/BottomMenu';
import {
  AppText,
  BottomSheet,
  Card,
  Header,
  PrimaryButton,
  Screen,
  SecondaryButton,
  Divider,
} from '../../../../shared/presentation/components/ui';
import { useThemeColors } from '../../../../shared/presentation/ThemeContext';
import { formatMoney } from '../../../../shared/utils/money';
import { useProfile } from '../../../profile/presentation/hooks/useProfile';
import { ServiceItemInputDto } from '../../application/dtos/QuotationDtos';
import { Quotation, IVA_RATE } from '../../domain/entities/Quotation';
import { calculateServiceSubtotal } from '../../domain/entities/ServiceItem';
import { createId } from '../../../../shared/utils/ids';

export function QuotationBuilderScreen() {
  const colors = useThemeColors();
  const { useCases, repositories } = useDependencies();
  const { navigate, routeParams } = useAppNavigation();
  const { profile } = useProfile();

  const isEditMode = !!routeParams.quotationId;
  const [editQuotation, setEditQuotation] = useState<Quotation | null>(null);

  const [clientName, setClientName] = useState('');
  const [clientRut, setClientRut] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [items, setItems] = useState<ServiceItemInputDto[]>([]);
  const [error, setError] = useState('');

  const [showBreakdown, setShowBreakdown] = useState(false);
  const [lastQuotation, setLastQuotation] = useState<Quotation | null>(null);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (!isEditMode) return;
    void (async () => {
      const q = await repositories.quotations.findById(routeParams.quotationId);
      if (!q) return;
      setEditQuotation(q);
      setClientName(q.clientName);
      setClientRut(q.clientRut ?? '');
      setClientPhone(q.clientPhone ?? '');
      setClientEmail(q.clientEmail ?? '');
      setClientAddress(q.clientAddress ?? '');
      setNotes(q.notes ?? '');
      setValidUntil(q.validUntil ?? '');
      setItems(q.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })));
    })();
  }, [isEditMode, routeParams.quotationId]);

  function addItem() {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof ServiceItemInputDto, value: string | number) {
    setItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  const subtotal = items.reduce((sum, item) => sum + calculateServiceSubtotal(item.quantity, item.unitPrice), 0);
  const ivaAmount = Math.round(subtotal * IVA_RATE / 100);
  const total = subtotal + ivaAmount;

  async function generateQuotation() {
    if (!clientName.trim()) {
      setError('Ingresa el nombre del cliente');
      return;
    }
    if (items.length === 0) {
      setError('Agrega al menos un servicio');
      return;
    }

    const hasEmpty = items.some((item) => !item.description.trim());
    if (hasEmpty) {
      setError('Todos los servicios deben tener descripcion');
      return;
    }

    const hasInvalidPrice = items.some((item) => item.unitPrice <= 0);
    if (hasInvalidPrice) {
      setError('Todos los servicios deben tener un precio mayor a 0');
      return;
    }

    try {
      setError('');

      if (isEditMode && editQuotation) {
        const updatedSubtotal = items.reduce((sum, item) => sum + calculateServiceSubtotal(item.quantity, item.unitPrice), 0);
        const updatedIvaAmount = Math.round(updatedSubtotal * IVA_RATE / 100);
        const updatedTotal = updatedSubtotal + updatedIvaAmount;

        const updatedQuotation: Quotation = {
          ...editQuotation,
          clientName: clientName.trim(),
          clientRut: clientRut.trim() || undefined,
          clientPhone: clientPhone.trim() || undefined,
          clientEmail: clientEmail.trim() || undefined,
          clientAddress: clientAddress.trim() || undefined,
          items: items.map((item, idx) => ({
            id: editQuotation.items[idx]?.id ?? createId('svc'),
            description: item.description.trim(),
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: calculateServiceSubtotal(item.quantity, item.unitPrice),
          })),
          subtotal: updatedSubtotal,
          ivaRate: IVA_RATE,
          ivaAmount: updatedIvaAmount,
          total: updatedTotal,
          notes: notes.trim() || undefined,
          validUntil: validUntil.trim() || undefined,
        };

        await useCases.updateQuotation.execute(updatedQuotation);
        setLastQuotation(updatedQuotation);
        setPdfUri(null);
        setShowBreakdown(true);

        try {
          setPdfLoading(true);
          const uri = await useCases.generateQuotationPdf.execute(updatedQuotation, profile);
          setPdfUri(uri);
        } catch {
        } finally {
          setPdfLoading(false);
        }
        return;
      }

      const quotation = await useCases.createQuotation.execute({
        clientName: clientName.trim(),
        clientRut: clientRut.trim() || undefined,
        clientPhone: clientPhone.trim() || undefined,
        clientEmail: clientEmail.trim() || undefined,
        clientAddress: clientAddress.trim() || undefined,
        items: items.map((item) => ({
          description: item.description.trim(),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        notes: notes.trim() || undefined,
        validUntil: validUntil.trim() || undefined,
      });

      setLastQuotation(quotation);
      setPdfUri(null);
      setShowBreakdown(true);

      try {
        setPdfLoading(true);
        const uri = await useCases.generateQuotationPdf.execute(quotation, profile);
        setPdfUri(uri);
      } catch {
      } finally {
        setPdfLoading(false);
      }
    } catch (currentError) {
      setError(
        currentError instanceof Error ? currentError.message : 'No se pudo generar la cotizacion.',
      );
    }
  }

  async function handleSharePdf() {
    if (!pdfUri || !lastQuotation) return;
    try {
      await useCases.shareCatalogPdf.shareFile(pdfUri, `Cotizacion - ${lastQuotation.clientName}`);
    } catch (currentError) {
      setError(
        currentError instanceof Error ? currentError.message : 'No se pudo compartir el PDF.',
      );
    }
  }

  return (
    <>
      <Screen>
        <Header
          eyebrow="Cotizaciones"
          title={isEditMode ? 'Editar cotizacion' : 'Nueva cotizacion'}
          subtitle={isEditMode ? 'Modifica los datos de la cotizacion' : 'Completa los datos para generar la cotizacion'}
          action={
            <Pressable onPress={() => navigate('Quotations')} style={{ padding: 8 }}>
              <Ionicons name="list-outline" size={20} color="#FFFFFF" />
            </Pressable>
          }
        />

        <Card>
          <AppText variant="labelMedium" color="secondary" style={{ marginBottom: 8 }}>Datos del cliente</AppText>
          <TextInput
            placeholder="Nombre del cliente *"
            placeholderTextColor={colors.textMuted}
            style={{
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: colors.borderDefault,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 15,
              fontWeight: '500',
              color: colors.textPrimary,
              marginBottom: 12,
            }}
            value={clientName}
            onChangeText={setClientName}
          />
          <TextInput
            placeholder="RUT (opcional)"
            placeholderTextColor={colors.textMuted}
            style={{
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: colors.borderDefault,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 15,
              fontWeight: '500',
              color: colors.textPrimary,
              marginBottom: 12,
            }}
            value={clientRut}
            onChangeText={setClientRut}
          />
          <TextInput
            placeholder="Telefono (opcional)"
            placeholderTextColor={colors.textMuted}
            style={{
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: colors.borderDefault,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 15,
              fontWeight: '500',
              color: colors.textPrimary,
              marginBottom: 12,
            }}
            value={clientPhone}
            onChangeText={setClientPhone}
          />
          <TextInput
            placeholder="Email (opcional)"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            style={{
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: colors.borderDefault,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 15,
              fontWeight: '500',
              color: colors.textPrimary,
              marginBottom: 12,
            }}
            value={clientEmail}
            onChangeText={setClientEmail}
          />
          <TextInput
            placeholder="Direccion (opcional)"
            placeholderTextColor={colors.textMuted}
            style={{
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: colors.borderDefault,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 15,
              fontWeight: '500',
              color: colors.textPrimary,
            }}
            value={clientAddress}
            onChangeText={setClientAddress}
          />
        </Card>

        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <AppText variant="labelMedium" color="secondary">Servicios</AppText>
            <Pressable
              onPress={addItem}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary + '18', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
            >
              <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
              <AppText variant="caption" color="accent" style={{ fontWeight: '600' as any }}>Agregar</AppText>
            </Pressable>
          </View>

          {items.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <Ionicons name="document-text-outline" size={32} color={colors.textMuted} style={{ marginBottom: 8 }} />
              <AppText variant="bodySmall" color="muted" style={{ textAlign: 'center' }}>
                Toca "Agregar" para incluir un servicio
              </AppText>
            </View>
          ) : (
            items.map((item, index) => (
              <View key={index} style={{ marginBottom: 16, paddingBottom: 16, borderBottomWidth: index < items.length - 1 ? 1 : 0, borderBottomColor: colors.borderDefault }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <AppText variant="caption" color="muted" style={{ fontWeight: '700' as any }}>Servicio {index + 1}</AppText>
                  <Pressable onPress={() => removeItem(index)}>
                    <Ionicons name="close-circle-outline" size={20} color={colors.error} />
                  </Pressable>
                </View>
                <TextInput
                  placeholder="Descripcion del servicio"
                  placeholderTextColor={colors.textMuted}
                  style={{
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: colors.borderDefault,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 15,
                    fontWeight: '500',
                    color: colors.textPrimary,
                    marginBottom: 8,
                  }}
                  value={item.description}
                  onChangeText={(v) => updateItem(index, 'description', v)}
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="caption" color="muted" style={{ marginBottom: 4 }}>Cantidad</AppText>
                    <TextInput
                      placeholder="1"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      style={{
                        borderRadius: 12,
                        borderWidth: 1.5,
                        borderColor: colors.borderDefault,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        fontSize: 15,
                        fontWeight: '500',
                        color: colors.textPrimary,
                      }}
                      value={item.quantity > 0 ? String(item.quantity) : ''}
                      onChangeText={(v) => {
                        const num = parseInt(v) || 0;
                        updateItem(index, 'quantity', num);
                      }}
                    />
                  </View>
                  <View style={{ flex: 1.5 }}>
                    <AppText variant="caption" color="muted" style={{ marginBottom: 4 }}>Precio unitario</AppText>
                    <TextInput
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      style={{
                        borderRadius: 12,
                        borderWidth: 1.5,
                        borderColor: colors.borderDefault,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        fontSize: 15,
                        fontWeight: '500',
                        color: colors.textPrimary,
                      }}
                      value={item.unitPrice > 0 ? String(item.unitPrice) : ''}
                      onChangeText={(v) => {
                        const num = parseFloat(v) || 0;
                        updateItem(index, 'unitPrice', num);
                      }}
                    />
                  </View>
                  <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                    <AppText variant="caption" color="muted" style={{ marginBottom: 4 }}>Subtotal</AppText>
                    <View style={{
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: colors.borderDefault,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      backgroundColor: colors.backgroundSurface,
                    }}>
                      <AppText variant="bodyMedium" color="primary" style={{ fontWeight: '600' as any }}>
                        {formatMoney(calculateServiceSubtotal(item.quantity, item.unitPrice))}
                      </AppText>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </Card>

        <Card variant="elevated" style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText variant="bodyMedium" color="muted">Precio Neto</AppText>
            <AppText variant="bodyMedium" color="primary" style={{ fontWeight: '600' as any }}>{formatMoney(subtotal)}</AppText>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText variant="bodyMedium" color="muted">IVA (19%)</AppText>
            <AppText variant="bodyMedium" color="primary">{formatMoney(ivaAmount)}</AppText>
          </View>
          <Divider />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText variant="headingSmall" color="primary">Total</AppText>
            <AppText variant="headingSmall" color="accent" style={{ fontWeight: '700' as any }}>{formatMoney(total)}</AppText>
          </View>
        </Card>

        <Card>
          <AppText variant="labelMedium" color="secondary" style={{ marginBottom: 8 }}>Opciones</AppText>
          <TextInput
            placeholder="Notas (opcional)"
            placeholderTextColor={colors.textMuted}
            style={{
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: colors.borderDefault,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 15,
              fontWeight: '500',
              color: colors.textPrimary,
              marginBottom: 12,
            }}
            value={notes}
            onChangeText={setNotes}
          />
          <TextInput
            placeholder="Vigente hasta (YYYY-MM-DD, opcional)"
            placeholderTextColor={colors.textMuted}
            style={{
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: colors.borderDefault,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 15,
              fontWeight: '500',
              color: colors.textPrimary,
            }}
            value={validUntil}
            onChangeText={setValidUntil}
          />
        </Card>

        {error ? (
          <AppText variant="bodySmall" color="error" style={{ fontWeight: '600' as any }}>{error}</AppText>
        ) : null}

        <PrimaryButton
          label={isEditMode ? 'Actualizar cotizacion' : 'Generar cotizacion'}
          icon="document-text-outline"
          onPress={generateQuotation}
        />

        <SecondaryButton
          label="Ver historial de cotizaciones"
          icon="receipt-outline"
          onPress={() => navigate('Quotations')}
          fullWidth
        />
      </Screen>

      <BottomSheet
        visible={showBreakdown}
        onClose={() => setShowBreakdown(false)}
        title={isEditMode ? 'Cotizacion actualizada' : 'Cotizacion generada'}
        stickyFooter={
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <SecondaryButton
                label="Cerrar"
                icon="close-outline"
                onPress={() => setShowBreakdown(false)}
              />
            </View>
            {pdfUri && (
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  label="Compartir PDF"
                  icon="share-social-outline"
                  onPress={handleSharePdf}
                />
              </View>
            )}
          </View>
        }
      >
        {lastQuotation && (
          <>
            <Card style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <AppText variant="bodyMedium" color="muted">N° Cotizacion</AppText>
                <AppText variant="bodyMedium" color="primary" style={{ fontWeight: '700' as any }}>N° {String(lastQuotation.quotationNumber).padStart(4, '0')}</AppText>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <AppText variant="bodyMedium" color="muted">Cliente</AppText>
                <AppText variant="bodyMedium" color="primary" style={{ fontWeight: '600' as any }}>{lastQuotation.clientName}</AppText>
              </View>
              {lastQuotation.clientRut ? (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <AppText variant="bodyMedium" color="muted">RUT</AppText>
                  <AppText variant="bodyMedium" color="primary">{lastQuotation.clientRut}</AppText>
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <AppText variant="bodyMedium" color="muted">Servicios</AppText>
                <AppText variant="bodyMedium" color="primary">{lastQuotation.items.length}</AppText>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <AppText variant="bodyMedium" color="muted">Precio Neto</AppText>
                <AppText variant="bodyMedium" color="primary">{formatMoney(lastQuotation.subtotal)}</AppText>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <AppText variant="bodyMedium" color="muted">IVA ({lastQuotation.ivaRate}%)</AppText>
                <AppText variant="bodyMedium" color="primary">{formatMoney(lastQuotation.ivaAmount)}</AppText>
              </View>
              <Divider />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <AppText variant="headingSmall" color="primary">Total</AppText>
                <AppText variant="headingSmall" color="accent" style={{ fontWeight: '700' as any }}>{formatMoney(lastQuotation.total)}</AppText>
              </View>
            </Card>

            <Card style={{ alignItems: 'center', paddingVertical: 20 }}>
              {pdfLoading ? (
                <>
                  <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 12 }} />
                  <AppText variant="bodyMedium" color="primary" style={{ fontWeight: '600' as any }}>Generando PDF...</AppText>
                  <AppText variant="caption" color="muted" style={{ marginTop: 4 }}>Preparando tu documento</AppText>
                </>
              ) : pdfUri ? (
                <>
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.success + '18', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Ionicons name="document-text" size={28} color={colors.success} />
                  </View>
                  <AppText variant="bodyMedium" color="primary" style={{ fontWeight: '600', marginBottom: 4 } as any}>PDF listo</AppText>
                  <AppText variant="caption" color="muted" style={{ textAlign: 'center' }}>Toca "Compartir PDF" para enviar el documento</AppText>
                </>
              ) : (
                <>
                  <Ionicons name="alert-circle-outline" size={32} color={colors.error} style={{ marginBottom: 8 }} />
                  <AppText variant="bodyMedium" color="error" style={{ fontWeight: '600' as any }}>No se pudo generar el PDF</AppText>
                  <AppText variant="caption" color="muted" style={{ marginTop: 4, textAlign: 'center' }}>La cotizacion se creo pero el PDF no se pudo generar</AppText>
                </>
              )}
            </Card>
          </>
        )}
      </BottomSheet>

      <BottomMenu />
    </>
  );
}
