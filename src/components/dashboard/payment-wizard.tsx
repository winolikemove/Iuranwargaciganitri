'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import { useApp } from '@/context/app-context';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle,
  Circle,
  Upload,
  FileText,
  CreditCard,
  Check,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  X,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

interface PaymentWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  unpaidPeriods: string[];
  paidPeriods: string[];
  pendingPeriods: string[];
}

const STEPS = [
  { id: 1, title: 'Pilih Periode', description: 'Pilih periode iuran yang akan dibayar' },
  { id: 2, title: 'Ringkasan', description: 'Ringkasan pembayaran Anda' },
  { id: 3, title: 'Upload Bukti', description: 'Upload bukti transfer' },
  { id: 4, title: 'Preview', description: 'Periksa kembali data pembayaran' },
  { id: 5, title: 'Konfirmasi', description: 'Konfirmasi dan kirim pembayaran' },
  { id: 6, title: 'Selesai', description: 'Pembayaran berhasil dikirim' },
];

export function PaymentWizard({
  open,
  onClose,
  onSuccess,
  unpaidPeriods,
  paidPeriods,
  pendingPeriods,
}: PaymentWizardProps) {
  const { user } = useAuth();
  const { settings } = useApp();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [buktiFile, setBuktiFile] = useState<File | null>(null);
  const [buktiPreview, setBuktiPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const monthlyFee = settings?.monthlyFee || 150000;
  const totalAmount = selectedPeriods.length * monthlyFee;

  const progress = (currentStep / 6) * 100;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handlePeriodToggle = (period: string) => {
    setSelectedPeriods((prev) =>
      prev.includes(period)
        ? prev.filter((p) => p !== period)
        : [...prev, period]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('File harus berupa gambar (JPG, PNG, dll)');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran file maksimal 5MB');
        return;
      }
      
      setBuktiFile(file);
      setError(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setBuktiPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    setBuktiFile(null);
    setBuktiPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedPeriods.length > 0;
      case 2:
        return true;
      case 3:
        return buktiFile !== null;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < 6 && canProceed()) {
      setError(null);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setError(null);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // In demo mode, we simulate the upload
      // In production, you'd upload to Google Drive first
      let buktiUrl = 'demo://uploaded-image';
      
      // For demo, if we have a preview, use it as base64
      if (buktiPreview) {
        buktiUrl = buktiPreview;
      }

      const result = await api.submitPayment(selectedPeriods, buktiUrl);

      if (result.ok) {
        setSuccess(true);
        setCurrentStep(6);
      } else {
        setError(result.error || 'Gagal mengirim pembayaran');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat mengirim pembayaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (success) {
      onSuccess();
    }
    // Reset state
    setCurrentStep(1);
    setSelectedPeriods([]);
    setBuktiFile(null);
    setBuktiPreview(null);
    setError(null);
    setSuccess(false);
    onClose();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Pilih periode iuran yang ingin Anda bayar. Periode yang sudah dibayar atau sedang diproses tidak dapat dipilih.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Periode Tersedia:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1">
                {unpaidPeriods.length === 0 ? (
                  <p className="col-span-full text-center text-muted-foreground py-4">
                    Tidak ada periode yang belum dibayar
                  </p>
                ) : (
                  unpaidPeriods.map((period) => {
                    const isPaid = paidPeriods.includes(period);
                    const isPending = pendingPeriods.includes(period);
                    const isSelected = selectedPeriods.includes(period);
                    const isDisabled = isPaid || isPending;

                    return (
                      <div
                        key={period}
                        className={`flex items-center space-x-2 p-3 rounded-lg border ${
                          isDisabled
                            ? 'bg-muted cursor-not-allowed opacity-60'
                            : isSelected
                            ? 'bg-primary/10 border-primary'
                            : 'hover:bg-muted/50 cursor-pointer'
                        }`}
                        onClick={() => !isDisabled && handlePeriodToggle(period)}
                      >
                        <Checkbox
                          id={period}
                          checked={isSelected || isPaid}
                          disabled={isDisabled}
                          onCheckedChange={() => handlePeriodToggle(period)}
                        />
                        <Label
                          htmlFor={period}
                          className={`cursor-pointer flex-1 ${isDisabled ? 'cursor-not-allowed' : ''}`}
                        >
                          <span className="font-medium">{period}</span>
                          {isPaid && (
                            <Badge variant="outline" className="ml-2 text-xs bg-green-100 text-green-700">
                              Sudah Bayar
                            </Badge>
                          )}
                          {isPending && (
                            <Badge variant="outline" className="ml-2 text-xs bg-yellow-100 text-yellow-700">
                              Diproses
                            </Badge>
                          )}
                        </Label>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {selectedPeriods.length > 0 && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Total periode dipilih:</p>
                <p className="text-2xl font-bold">{selectedPeriods.length} periode</p>
                <p className="text-lg font-semibold text-primary">{formatCurrency(totalAmount)}</p>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Ringkasan Pembayaran</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nama</span>
                  <span className="font-medium">{user?.nama}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Blok / No. Rumah</span>
                  <span className="font-medium">{user?.blok} / {user?.nomorRumah}</span>
                </div>
                <div className="border-t pt-3">
                  <p className="text-sm text-muted-foreground mb-2">Periode yang dibayar:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedPeriods.map((period) => (
                      <Badge key={period} variant="secondary">
                        {period}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Iuran per bulan</span>
                    <span>{formatCurrency(monthlyFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Jumlah periode</span>
                    <span>{selectedPeriods.length} bulan</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <Alert>
              <Upload className="h-4 w-4" />
              <AlertDescription>
                Upload bukti transfer pembayaran. Format yang didukung: JPG, PNG. Maksimal 5MB.
              </AlertDescription>
            </Alert>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {buktiPreview ? (
              <div className="relative">
                <img
                  src={buktiPreview}
                  alt="Preview bukti transfer"
                  className="w-full max-h-64 object-contain rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="font-medium">Klik untuk upload bukti transfer</p>
                <p className="text-sm text-muted-foreground">atau drag & drop file di sini</p>
              </div>
            )}

            {buktiFile && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>{buktiFile.name}</span>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h4 className="font-semibold">Periksa kembali data pembayaran Anda:</h4>

            <div className="grid gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Data Warga</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nama:</span>
                    <p className="font-medium">{user?.nama}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Blok:</span>
                    <p className="font-medium">{user?.blok}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">No. Rumah:</span>
                    <p className="font-medium">{user?.nomorRumah}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Telepon:</span>
                    <p className="font-medium">{user?.telepon}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Detail Pembayaran</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Periode:</span>
                      <span>{selectedPeriods.join(', ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Jumlah periode:</span>
                      <span>{selectedPeriods.length} bulan</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Iuran per bulan:</span>
                      <span>{formatCurrency(monthlyFee)}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-2 border-t">
                      <span>Total Pembayaran:</span>
                      <span className="text-primary">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Bukti Transfer</CardTitle>
                </CardHeader>
                <CardContent>
                  {buktiPreview && (
                    <img
                      src={buktiPreview}
                      alt="Bukti transfer"
                      className="w-full max-h-40 object-contain rounded-lg"
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4 text-center">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Pastikan semua data sudah benar sebelum mengirim pembayaran.
              </AlertDescription>
            </Alert>

            <div className="py-4">
              <p className="text-lg font-medium">Anda akan mengirim pembayaran untuk:</p>
              <p className="text-3xl font-bold text-primary my-2">{formatCurrency(totalAmount)}</p>
              <p className="text-muted-foreground">
                {selectedPeriods.length} periode: {selectedPeriods.join(', ')}
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 6:
        return (
          <div className="space-y-4 text-center py-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold">Pembayaran Berhasil Dikirim!</h3>
            <p className="text-muted-foreground">
              Pembayaran Anda sedang diproses dan akan diverifikasi oleh pengurus.
            </p>
            <Card className="text-left mt-4">
              <CardContent className="pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Pembayaran:</span>
                    <span className="font-medium">{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Periode:</span>
                    <span className="font-medium">{selectedPeriods.length} bulan</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="secondary">Menunggu Verifikasi</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pembayaran Iuran
          </DialogTitle>
          <DialogDescription>
            Wizard pembayaran iuran warga
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex flex-col items-center ${
                  currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    currentStep > step.id
                      ? 'bg-primary text-primary-foreground'
                      : currentStep === step.id
                      ? 'bg-primary/20 border-2 border-primary'
                      : 'bg-muted'
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <span className="text-xs mt-1 hidden md:block">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="py-4 min-h-[300px]">{renderStepContent()}</div>

        {/* Navigation Buttons */}
        {currentStep < 6 && (
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>

            {currentStep < 5 ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Lanjut
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !canProceed()}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Kirim Pembayaran
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {currentStep === 6 && (
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleClose}>Tutup</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
