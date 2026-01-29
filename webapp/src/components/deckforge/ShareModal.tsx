import { useState, useEffect } from 'react';
import { X, Link, Copy, Code, Check, Trash2, Share2 } from 'lucide-react';
import { shareAPI, generateEmbedCode, copyToClipboard } from '@/lib/share';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  designId: string;
  designName: string;
}

export function ShareModal({ isOpen, onClose, designId, designName }: ShareModalProps) {
  const [shareUrl, setShareUrl] = useState<string>('');
  const [shareToken, setShareToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState<'url' | 'embed' | null>(null);
  const [embedWidth, setEmbedWidth] = useState('400');
  const [embedHeight, setEmbedHeight] = useState('600');

  useEffect(() => {
    if (isOpen && designId) {
      loadShareLink();
    }
  }, [isOpen, designId]);

  const loadShareLink = async () => {
    setIsLoading(true);
    try {
      const result = await shareAPI.createShareLink(designId);
      setShareUrl(result.share_url);
      setShareToken(result.share_token);
    } catch (error: any) {
      console.error('Failed to create share link:', error);
      toast({
        title: 'Failed to create share link',
        description: error.response?.data?.error || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyUrl = async () => {
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied('url');
      toast({
        title: '✓ Link copied',
        description: 'Share link copied to clipboard',
      });
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const handleCopyEmbed = async () => {
    const embedCode = generateEmbedCode(shareToken, parseInt(embedWidth), parseInt(embedHeight));
    const success = await copyToClipboard(embedCode);
    if (success) {
      setCopied('embed');
      toast({
        title: '✓ Embed code copied',
        description: 'Paste this code into your website',
      });
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const handleRevoke = async () => {
    if (!confirm('Revoke share link? Anyone with the current link will no longer be able to view this design.')) {
      return;
    }

    try {
      await shareAPI.revokeShareLink(designId);
      toast({
        title: '✓ Link revoked',
        description: 'Share link has been disabled',
      });
      onClose();
    } catch (error) {
      console.error('Failed to revoke share link:', error);
      toast({
        title: 'Failed to revoke link',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card border-2 border-border shadow-xl w-full max-w-2xl max-h-[85vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            <h2 className="font-display text-lg uppercase tracking-wider">Share Design</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Design name */}
          <div>
            <h3 className="font-medium text-lg">{designName}</h3>
            <p className="text-sm text-muted-foreground">
              Anyone with the link can view this design (read-only)
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Generating share link...</p>
            </div>
          ) : (
            <>
              {/* Share URL */}
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Share Link
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="font-mono text-sm"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <button
                    onClick={handleCopyUrl}
                    className="btn-brutal px-4 flex items-center gap-2 whitespace-nowrap"
                  >
                    {copied === 'url' ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Embed code */}
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="py-2">
                  <span className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">
                    Embed on Website
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Width (px)</Label>
                    <Input
                      type="number"
                      value={embedWidth}
                      onChange={(e) => setEmbedWidth(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Height (px)</Label>
                    <Input
                      type="number"
                      value={embedHeight}
                      onChange={(e) => setEmbedHeight(e.target.value)}
                      className="h-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Embed Code</Label>
                  <div className="relative">
                    <textarea
                      value={generateEmbedCode(shareToken, parseInt(embedWidth), parseInt(embedHeight))}
                      readOnly
                      rows={3}
                      className="w-full p-2 border border-border bg-secondary font-mono text-xs rounded"
                      onClick={(e) => e.currentTarget.select()}
                    />
                  </div>
                  <button
                    onClick={handleCopyEmbed}
                    className="w-full btn-brutal py-2 flex items-center justify-center gap-2"
                  >
                    {copied === 'embed' ? (
                      <>
                        <Check className="w-4 h-4" />
                        Embed Code Copied!
                      </>
                    ) : (
                      <>
                        <Code className="w-4 h-4" />
                        Copy Embed Code
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Revoke link */}
              <div className="pt-4 border-t border-border">
                <button
                  onClick={handleRevoke}
                  className="w-full btn-brutal py-2.5 flex items-center justify-center gap-2 border-destructive text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                  Revoke Share Link
                </button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  This will disable the current link. You can create a new one anytime.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
