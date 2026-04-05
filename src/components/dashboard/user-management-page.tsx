'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useApp } from '@/context/app-context';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Users,
  Search,
  Loader2,
  AlertCircle,
  UserCheck,
  UserX,
  Ban,
  Shield,
  MoreHorizontal,
} from 'lucide-react';
import type { SafeUser } from '@/types';

export function UserManagementPage() {
  const { user, permissions } = useAuth();
  const { settings } = useApp();
  
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [pendingUsers, setPendingUsers] = useState<SafeUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  
  // Filters
  const [filterBlok, setFilterBlok] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab, filterBlok, filterStatus]);

  const loadData = async () => {
    setIsLoading(true);
    
    try {
      if (activeTab === 'pending') {
        const res = await api.getPendingUsers();
        if (res.ok && res.data) {
          setPendingUsers(res.data);
        }
      } else {
        const res = await api.getUsers({
          blok: filterBlok !== 'ALL' ? filterBlok : undefined,
          status: filterStatus !== 'ALL' ? filterStatus : undefined,
        });
        if (res.ok && res.data) {
          setUsers(res.data);
        }
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    const result = await api.approveUser(userId);
    if (result.ok) {
      loadData();
    }
  };

  const handleReject = async (userId: string) => {
    const result = await api.rejectUser(userId);
    if (result.ok) {
      loadData();
    }
  };

  const handleBlock = async (userId: string) => {
    const result = await api.blockUser(userId);
    if (result.ok) {
      loadData();
    }
  };

  const handleUnblock = async (userId: string) => {
    const result = await api.unblockUser(userId);
    if (result.ok) {
      loadData();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500">Aktif</Badge>;
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>;
      case 'BLOCKED':
        return <Badge variant="destructive">Diblokir</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Ditolak</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPERADMIN':
        return <Badge className="bg-purple-500">Super Admin</Badge>;
      case 'ADMIN':
        return <Badge className="bg-blue-500">Admin</Badge>;
      case 'BENDAHARA':
        return <Badge className="bg-amber-500">Bendahara</Badge>;
      default:
        return <Badge variant="outline">Warga</Badge>;
    }
  };

  const filteredUsers = users.filter((u) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        u.nama.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.nomorRumah.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const renderUserTable = (userList: SafeUser[], showActions: boolean = true) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Warga</TableHead>
            <TableHead>Kontak</TableHead>
            <TableHead>Alamat</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            {showActions && <TableHead className="w-[150px]">Aksi</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {userList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                Tidak ada data warga
              </TableCell>
            </TableRow>
          ) : (
            userList.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={u.photoUrl || undefined} />
                      <AvatarFallback className="bg-emerald-500 text-white">
                        {u.nama.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{u.nama}</p>
                      <p className="text-xs text-muted-foreground">NIK: {u.nik}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>{u.email}</p>
                    <p className="text-muted-foreground">{u.telepon}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <p>Blok {u.blok} - No. {u.nomorRumah}</p>
                </TableCell>
                <TableCell>{getRoleBadge(u.role)}</TableCell>
                <TableCell>{getStatusBadge(u.status)}</TableCell>
                {showActions && (
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {u.status === 'PENDING' && permissions?.canApproveUsers && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApprove(u.id)}
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                          {permissions?.canRejectUsers && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(u.id)}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                      {u.status === 'ACTIVE' && permissions?.canBlockUsers && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleBlock(u.id)}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
                      {u.status === 'BLOCKED' && permissions?.canBlockUsers && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnblock(u.id)}
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (!permissions?.canViewAllUsers && !permissions?.canViewOwnBlokUsers) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Anda tidak memiliki akses untuk melihat halaman ini.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            <Users className="h-4 w-4 mr-2" />
            Semua Warga
          </TabsTrigger>
          {permissions?.canApproveUsers && (
            <TabsTrigger value="pending">
              <UserCheck className="h-4 w-4 mr-2" />
              Menunggu Persetujuan
              {pendingUsers.length > 0 && (
                <Badge variant="secondary" className="ml-2">{pendingUsers.length}</Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Daftar Warga</CardTitle>
                  <CardDescription>
                    {permissions?.canViewAllUsers ? 'Semua warga' : `Warga Blok ${user?.blok}`}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-wrap gap-4 mb-4">
                {permissions?.canViewAllUsers && (
                  <Select value={filterBlok} onValueChange={setFilterBlok}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Semua Blok" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua Blok</SelectItem>
                      {settings?.bloks?.map((blok) => (
                        <SelectItem key={blok} value={blok}>Blok {blok}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Status</SelectItem>
                    <SelectItem value="ACTIVE">Aktif</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="BLOCKED">Diblokir</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari nama, email, atau no. rumah..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                renderUserTable(filteredUsers)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Warga Menunggu Persetujuan</CardTitle>
              <CardDescription>{pendingUsers.length} warga menunggu persetujuan</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                renderUserTable(pendingUsers)
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
