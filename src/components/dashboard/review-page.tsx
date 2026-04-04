'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useApp } from '@/context/app-context';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Star,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Trash2,
} from 'lucide-react';
import type { Review } from '@/types';

export function ReviewPage() {
  const { user, permissions } = useAuth();
  const { settings } = useApp();
  
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    rating: 5,
    comment: '',
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    
    try {
      if (activeTab === 'my') {
        const res = await api.getMyReview();
        if (res.ok && res.data) {
          setMyReview(res.data);
          setFormData({
            rating: res.data.rating,
            comment: res.data.comment,
          });
        }
      } else if (activeTab === 'pending' && permissions?.canApproveReviews) {
        const res = await api.getPendingReviews();
        if (res.ok && res.data) {
          setPendingReviews(res.data);
        }
      } else if (activeTab === 'all' && permissions?.canApproveReviews) {
        const res = await api.getAllReviews();
        if (res.ok && res.data) {
          setAllReviews(res.data);
        }
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const result = await api.submitReview(formData.rating, formData.comment);
      if (result.ok) {
        loadData();
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (reviewId: string) => {
    const result = await api.approveReview(reviewId);
    if (result.ok) {
      loadData();
    }
  };

  const handleReject = async (reviewId: string) => {
    const result = await api.rejectReview(reviewId);
    if (result.ok) {
      loadData();
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (confirm('Yakin ingin menghapus testimoni ini?')) {
      const result = await api.deleteReview(reviewId);
      if (result.ok) {
        loadData();
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-500">Disetujui</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Ditolak</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (!settings?.enableReviews) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Fitur testimoni tidak diaktifkan.
        </AlertDescription>
      </Alert>
    );
  }

  const renderReviewCard = (review: Review, showActions: boolean = false) => (
    <Card key={review.id}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Avatar>
              <AvatarImage src={review.userPhotoUrl || undefined} />
              <AvatarFallback>
                {review.userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium">{review.userName}</h4>
                {getStatusBadge(review.status)}
              </div>
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= review.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-muted-foreground">{review.comment}</p>
            </div>
          </div>
          {showActions && review.status === 'PENDING' && permissions?.canApproveReviews && (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="default"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleApprove(review.id)}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleReject(review.id)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          )}
          {showActions && permissions?.canDeleteReviews && (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => handleDelete(review.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Testimoni</h2>
        <p className="text-muted-foreground">Bagikan pengalaman Anda</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="my">
            <Star className="h-4 w-4 mr-2" />
            Testimoni Saya
          </TabsTrigger>
          {permissions?.canApproveReviews && (
            <TabsTrigger value="pending">
              Pending
              {pendingReviews.length > 0 && (
                <Badge variant="secondary" className="ml-2">{pendingReviews.length}</Badge>
              )}
            </TabsTrigger>
          )}
          {permissions?.canApproveReviews && (
            <TabsTrigger value="all">Semua</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="my" className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : myReview ? (
            renderReviewCard(myReview)
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Tulis Testimoni</CardTitle>
                <CardDescription>Bagikan pengalaman Anda sebagai warga</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Rating</Label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormData({ ...formData, rating: star })}
                          className="p-1"
                        >
                          <Star
                            className={`h-8 w-8 transition-colors ${
                              star <= formData.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300 hover:text-yellow-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Testimoni</Label>
                    <Textarea
                      placeholder="Bagikan pengalaman Anda..."
                      value={formData.comment}
                      onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                      rows={4}
                      required
                    />
                  </div>
                  
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      'Kirim Testimoni'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : pendingReviews.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Tidak ada testimoni pending
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingReviews.map((review) => renderReviewCard(review, true))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : allReviews.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Belum ada testimoni
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {allReviews.map((review) => renderReviewCard(review, true))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
