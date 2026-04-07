'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useApp } from '@/context/app-context';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Users,
  MessageCircle,
  Edit,
  Plus,
  RefreshCw,
  Loader2,
  User,
  Phone,
  Shield,
  AlertCircle,
} from 'lucide-react';
import type { StrukturOrganisasi, PengurusWithJabatan, JabatanInfo, SafeUser, JabatanKey, KontakRT } from '@/types';

interface JabatanListResponse {
  jabatanPerBlok: Record<string, JabatanInfo>;
  jabatanBersama: Record<string, JabatanInfo>;
  allJabatan: Record<string, JabatanInfo>;
}

export function OrganizationPage() {
  const { user, permissions } = useAuth();
  const { strukturOrganisasi, refreshStrukturOrganisasi } = useApp();
  const { toast } = useToast();
  
  const [jabatanList, setJabatanList] = useState<JabatanListResponse | null>(null);
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPengurus, setSelectedPengurus] = useState<PengurusWithJabatan | null>(null);
  const [selectedJabatan, setSelectedJabatan] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [jabatanResult, usersResult] = await Promise.all([
          api.getJabatanList(),
          api.getUsers({ status: 'ACTIVE' }),
        ]);
        
        if (jabatanResult.ok && jabatanResult.data) {
          setJabatanList(jabatanResult.data);
        } else if (!jabatanResult.ok) {
          throw new Error('Gagal memuat data jabatan');
        }
        
        if (usersResult.ok && usersResult.data) {
          setUsers(usersResult.data);
        } else if (!usersResult.ok) {
          throw new Error('Gagal memuat data pengguna');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data organisasi';
        console.error('Failed to load organization data:', err);
        setError(errorMessage);
        toast({
          variant: 'destructive',
          title: 'Gagal Memuat Data',
          description: errorMessage,
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [toast]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await refreshStrukturOrganisasi();
      toast({
        title: 'Berhasil',
        description: 'Data struktur organisasi berhasil diperbarui',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal memperbarui data';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Gagal Memperbarui',
        description: errorMessage,
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleEditClick = (pengurus: PengurusWithJabatan) => {
    setSelectedPengurus(pengurus);
    setSelectedJabatan(pengurus.jabatan || 'NONE');
    setEditDialogOpen(true);
  };

  const handleAssignClick = (jabatan: string, blok?: string) => {
    // Create a placeholder for assigning new user
    setSelectedPengurus({
      id: '',
      nama: '',
      blok: blok || '',
      telepon: '',
      photoUrl: '',
      jabatan: jabatan,
      jabatanLabel: jabatanList?.allJabatan[jabatan]?.label || jabatan,
      order: jabatanList?.allJabatan[jabatan]?.order || 0,
    });
    setSelectedJabatan(jabatan);
    setEditDialogOpen(true);
  };

  const handleSaveJabatan = async () => {
    if (!selectedPengurus) return;
    
    // If no user selected and we're assigning a new position
    if (!selectedPengurus.id && selectedJabatan !== 'NONE') {
      // This is handled by selecting a user first
      return;
    }
    
    setSaving(true);
    try {
      const result = await api.updateUserJabatan(
        selectedPengurus.id,
        selectedJabatan === 'NONE' ? '' : selectedJabatan
      );
      
      if (result.ok) {
        await refreshStrukturOrganisasi();
        // Reload users to reflect changes
        const usersResult = await api.getUsers({ status: 'ACTIVE' });
        if (usersResult.ok && usersResult.data) {
          setUsers(usersResult.data);
        }
        setEditDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to update jabatan:', error);
    } finally {
      setSaving(false);
    }
  };

  const getWhatsAppLink = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const waNumber = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    return `https://wa.me/${waNumber}`;
  };

  const canManageJabatan = permissions?.canChangeUserRole || permissions?.canManageRoles;

  // Get users available for assignment (those without jabatan or from the same blok)
  const getAvailableUsers = (targetBlok?: string, jabatanScope?: 'BLOK' | 'SHARED') => {
    let availableUsers = users.filter(u => u.status === 'ACTIVE');
    
    // For BLOK scope, filter by blok if specified
    if (jabatanScope === 'BLOK' && targetBlok) {
      availableUsers = availableUsers.filter(u => u.blok === targetBlok);
    }
    
    return availableUsers;
  };

  // Render empty position slot
  const renderEmptySlot = (jabatanKey: string, jabatanInfo: JabatanInfo, blok?: string) => {
    return (
      <div
        key={jabatanKey}
        className="flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 transition-colors cursor-pointer"
        onClick={() => canManageJabatan && handleAssignClick(jabatanKey, blok)}
      >
        <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
          <Plus className="h-5 w-5 text-emerald-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-emerald-600">{jabatanInfo.label}</h4>
          <p className="text-xs text-muted-foreground">Klik untuk menugaskan</p>
        </div>
      </div>
    );
  };

  // Render pengurus card
  const renderPengurusCard = (pengurus: PengurusWithJabatan, showEdit: boolean = true) => {
    return (
      <div
        key={pengurus.id}
        className="flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50/50 transition-colors group"
      >
        <Avatar className="h-12 w-12">
          <AvatarImage src={pengurus.photoUrl || undefined} alt={pengurus.nama} />
          <AvatarFallback className="bg-emerald-500 text-white">
            {pengurus.nama.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate">{pengurus.nama}</h4>
          <p className="text-xs text-emerald-600 font-medium">{pengurus.jabatanLabel}</p>
          {pengurus.telepon && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Phone className="h-3 w-3" />
              {pengurus.telepon}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {pengurus.telepon && (
            <a
              href={getWhatsAppLink(pengurus.telepon)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500 hover:bg-green-600 text-white text-xs font-medium transition-colors shadow-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>WhatsApp</span>
            </a>
          )}
          {canManageJabatan && showEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="p-2 rounded-full hover:bg-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleEditClick(pengurus)}
            >
              <Edit className="h-4 w-4 text-emerald-600" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  // Render a column section
  const renderColumn = (
    title: string,
    pengurusList: PengurusWithJabatan[],
    jabatanPositions: Record<string, JabatanInfo>,
    blok?: string,
    darkMode: boolean = false,
    kontakRT?: KontakRT | null
  ) => {
    // Sort pengurus by order
    const sortedPengurus = [...pengurusList].sort((a, b) => a.order - b.order);
    
    // Find filled positions
    const filledPositions = new Set(sortedPengurus.map(p => p.jabatan));
    
    // Find empty positions
    const emptyPositions = Object.entries(jabatanPositions)
      .filter(([key]) => !filledPositions.has(key))
      .sort((a, b) => a[1].order - b[1].order);

    return (
      <Card className={`${darkMode ? 'bg-[#003527] text-white border-emerald-700' : 'bg-white'} shadow-lg`}>
        <CardHeader className="pb-2">
          <CardTitle className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-[#003527]'} flex items-center gap-2`}>
            {darkMode ? <Users className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
            {title}
          </CardTitle>
          {darkMode && (
            <CardDescription className="text-emerald-200 text-xs">
              Sie. Keamanan, Kebersihan & DKM Masjid Al Birr
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Kontak RT */}
          {kontakRT && (kontakRT.nama || kontakRT.telepon) && (
            <div className={`mb-3 p-3 rounded-lg ${darkMode ? 'bg-emerald-900/50 border border-emerald-600' : 'bg-blue-50 border border-blue-100'}`}>
              <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-emerald-200' : 'text-blue-700'}`}>
                Kontak RT {title}
              </p>
              {kontakRT.nama && (
                <p className={`font-medium text-sm ${darkMode ? 'text-white' : ''}`}>{kontakRT.nama}</p>
              )}
              {kontakRT.telepon && (
                <a
                  href={getWhatsAppLink(kontakRT.telepon)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2 py-1 mt-1 rounded-full bg-green-500 hover:bg-green-600 text-white text-xs font-medium transition-colors"
                >
                  <MessageCircle className="h-3 w-3" />
                  <span>{kontakRT.telepon}</span>
                </a>
              )}
            </div>
          )}
          
          {/* Filled positions */}
          {sortedPengurus.map((pengurus) => renderPengurusCard(pengurus, !darkMode))}
          
          {/* Empty positions */}
          {emptyPositions.map(([key, info]) => 
            canManageJabatan ? renderEmptySlot(key, info, blok) : null
          )}
          
          {/* No positions at all */}
          {sortedPengurus.length === 0 && emptyPositions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Belum ada pengurus</p>
            </div>
          )}
          
          {/* Show message if no empty positions but nothing filled either */}
          {sortedPengurus.length === 0 && emptyPositions.length > 0 && !canManageJabatan && (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Posisi masih kosong</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Error state with retry option
  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="font-medium">Gagal Memuat Data</p>
              <p className="text-sm">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="ml-4 bg-white hover:bg-red-50 border-red-300"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#003527]">Struktur Organisasi</h2>
          <p className="text-muted-foreground">
            Pengurus yang berdedikasi untuk kesejahteraan dan keharmonisan warga
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Organization Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Blok A */}
        {strukturOrganisasi && jabatanList && renderColumn(
          'Blok A',
          strukturOrganisasi.blokA.pengurus,
          jabatanList.jabatanPerBlok,
          'A',
          false,
          strukturOrganisasi.blokA.kontakRT
        )}

        {/* Blok B */}
        {strukturOrganisasi && jabatanList && renderColumn(
          'Blok B',
          strukturOrganisasi.blokB.pengurus,
          jabatanList.jabatanPerBlok,
          'B',
          false,
          strukturOrganisasi.blokB.kontakRT
        )}

        {/* Bersama */}
        {strukturOrganisasi && jabatanList && renderColumn(
          'Bersama',
          strukturOrganisasi.bersama.pengurus,
          jabatanList.jabatanBersama,
          undefined,
          true,
          null
        )}
      </div>

      {/* Info Card */}
      <Card className="bg-emerald-50 border-emerald-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-emerald-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-emerald-800">Tentang Struktur Organisasi</p>
              <p className="text-emerald-600 mt-1">
                Struktur organisasi terbagi menjadi pengurus per blok (Ketua RT, Wakil Ketua, Sekretaris, Bendahara) 
                dan pengurus bersama (Sie. Keamanan, Sie. Kebersihan, DKM Masjid Al Birr) yang melayani semua warga.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Jabatan Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              {selectedPengurus?.id ? 'Ubah Jabatan' : 'Tugaskan Pengurus'}
            </DialogTitle>
            <DialogDescription>
              {selectedPengurus?.id 
                ? `Pilih jabatan baru untuk ${selectedPengurus.nama}`
                : 'Pilih warga untuk menempati posisi ini'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* User selection for new assignments */}
            {!selectedPengurus?.id && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Pilih Warga</label>
                <Select
                  value={selectedPengurus?.id || ''}
                  onValueChange={(value) => {
                    const selectedUser = users.find(u => u.id === value);
                    if (selectedUser && selectedPengurus) {
                      setSelectedPengurus({
                        ...selectedPengurus,
                        id: selectedUser.id,
                        nama: selectedUser.nama,
                        blok: selectedUser.blok,
                        telepon: selectedUser.telepon,
                        photoUrl: selectedUser.photoUrl || '',
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih warga..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableUsers(
                      selectedPengurus?.blok,
                      jabatanList?.allJabatan[selectedJabatan]?.scope
                    ).map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        <div className="flex items-center gap-2">
                          <span>{u.nama}</span>
                          <Badge variant="outline" className="text-xs">
                            Blok {u.blok}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Current user info */}
            {selectedPengurus?.id && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedPengurus.photoUrl || undefined} />
                  <AvatarFallback className="bg-emerald-500 text-white">
                    {selectedPengurus.nama.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedPengurus.nama}</p>
                  <p className="text-sm text-muted-foreground">
                    Blok {selectedPengurus.blok} • {selectedPengurus.jabatanLabel || 'Tidak ada jabatan'}
                  </p>
                </div>
              </div>
            )}

            {/* Jabatan selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Pilih Jabatan</label>
              <Select
                value={selectedJabatan}
                onValueChange={setSelectedJabatan}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jabatan..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">
                    <span className="text-muted-foreground">Tidak ada jabatan</span>
                  </SelectItem>
                  
                  {jabatanList && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Jabatan Per Blok
                      </div>
                      {Object.entries(jabatanList.jabatanPerBlok).map(([key, info]) => (
                        <SelectItem key={key} value={key}>
                          {info.label}
                        </SelectItem>
                      ))}
                      
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
                        Jabatan Bersama
                      </div>
                      {Object.entries(jabatanList.jabatanBersama).map(([key, info]) => (
                        <SelectItem key={key} value={key}>
                          {info.label}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Warning for BLOK scope */}
            {selectedJabatan !== 'NONE' && 
             jabatanList?.allJabatan[selectedJabatan]?.scope === 'BLOK' && 
             selectedPengurus?.blok && (
              <div className="text-xs text-amber-600 flex items-start gap-2">
                <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  Jabatan ini hanya untuk Blok {selectedPengurus.blok}. 
                  Pastikan warga yang dipilih berada di blok yang sama.
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button
              onClick={handleSaveJabatan}
              disabled={saving || !selectedPengurus?.id}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
