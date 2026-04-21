/**
 * Markets Table Component
 */

'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Chip,
  InputAdornment,
  Select,
  FormControl,
  InputLabel,
  MenuItem as SelectMenuItem,
  Typography,
  Checkbox,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
} from '@mui/icons-material';
import Stack from '@mui/material/Stack';
import {
  TableErrorState,
  TableEmptyState,
  TableLoadingState,
} from '@/shared/components/TableStates';
import { Market, MarketsFilter, useDeleteMarket, useToggleMarket } from '@/features/markets';
import { PaginationMeta } from '@/shared/types/common.types';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { SelectedMarketProfile } from './SelectedMarketProfile';
import { useTableExport } from '@/shared/hooks/useTableExport';
import { DeleteConfirmationDialog } from '@/shared/components/DeleteConfirmationDialog';
import { SuccessDialog } from '@/shared/components/SuccessDialog';
import { useQueryClient } from '@tanstack/react-query';
import { PrevNextPagination } from '@/shared/components/PrevNextPagination';

interface MarketsTableProps {
  markets: Market[];
  pagination: PaginationMeta | null;
  isLoading: boolean;
  error: Error | null;
  filters: MarketsFilter;
  onFilterChange: (filters: Partial<MarketsFilter>) => void;
  onClearFilters: () => void;
  onAddMarket: () => void;
  onRefresh: () => void;
  selectedMarket?: Market | null;
  onMarketSelect?: (market: Market | null) => void;
}

interface MarketRowProps {
  market: Market;
  isSelected: boolean;
  onSelect: (marketId: number, market: Market) => void;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, market: Market) => void;
}

const MarketRow = memo(function MarketRow({
  market,
  isSelected,
  onSelect,
  onMenuOpen,
}: MarketRowProps) {
  return (
    <TableRow
      hover
      onClick={() => onSelect(market.id, market)}
      sx={{
        cursor: 'pointer',
        bgcolor: isSelected ? 'action.selected' : 'transparent',
        '&:hover': {
          bgcolor: isSelected ? 'action.selected' : 'action.hover',
        },
      }}
    >
      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onChange={() => onSelect(market.id, market)}
        />
      </TableCell>
      <TableCell>{market.id}</TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight={500}>
          {market.displayName}
        </Typography>
      </TableCell>
      <TableCell>
        <Chip label={market.category} size="small" variant="outlined" />
      </TableCell>
      <TableCell align="center">{market.selections?.length || 0}</TableCell>
      <TableCell>
        <Chip
          label={market.isActive ? 'Active' : 'Inactive'}
          size="small"
          color={market.isActive ? 'success' : 'default'}
        />
      </TableCell>
      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
        <IconButton
          size="small"
          onClick={(e) => onMenuOpen(e, market)}
        >
          <MoreVertIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );
});

export const MarketsTable = memo(function MarketsTable({
  markets,
  pagination,
  isLoading,
  error,
  filters,
  onFilterChange,
  onClearFilters,
  onAddMarket,
  onRefresh,
  selectedMarket,
  onMarketSelect,
}: MarketsTableProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState(filters.search || '');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const deleteMarket = useDeleteMarket();
  const toggleMarket = useToggleMarket();
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuMarket, setMenuMarket] = useState<Market | null>(null);
  
  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSuccessDialogOpen, setDeleteSuccessDialogOpen] = useState(false);
  const [marketToDelete, setMarketToDelete] = useState<Market | null>(null);
  
  const debouncedSearch = useDebounce(search, 300);
  
  // Sync selectedIds with selectedMarket (single-select)
  useEffect(() => {
    if (selectedMarket) {
      setSelectedIds(new Set([selectedMarket.id]));
    } else {
      setSelectedIds(new Set());
    }
  }, [selectedMarket]);
  
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFilterChange({ search: debouncedSearch || undefined, page: 1 });
    }
  }, [debouncedSearch, filters.search, onFilterChange]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleSelectOne = useCallback((marketId: number, market: Market) => {
    // Single-select: if clicking the same item, deselect it; otherwise select the new one
    if (selectedMarket?.id === marketId) {
      // Deselect if clicking the already selected item
      setSelectedIds(new Set());
      setTimeout(() => onMarketSelect?.(null), 0);
    } else {
      // Select the new item (only one at a time)
      setSelectedIds(new Set([marketId]));
      setTimeout(() => onMarketSelect?.(market), 0);
    }
  }, [selectedMarket, onMarketSelect]);

  const handleFilterChange = useCallback((key: keyof MarketsFilter, value: string | boolean | undefined) => {
    onFilterChange({ [key]: value || undefined, page: 1 } as Partial<MarketsFilter>);
  }, [onFilterChange]);

  const handleClearFilters = useCallback(() => {
    setSearch('');
    onClearFilters();
  }, [onClearFilters]);

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, market: Market) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuMarket(market);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setMenuMarket(null);
  }, []);

  const handleViewDetails = useCallback(() => {
    if (menuMarket) {
      router.push(`/predictions/markets/${menuMarket.id}`);
      handleMenuClose();
    }
  }, [menuMarket, router, handleMenuClose]);

  const handleEdit = useCallback(() => {
    if (menuMarket) {
      router.push(`/predictions/markets/${menuMarket.id}/edit`);
      handleMenuClose();
    }
  }, [menuMarket, router, handleMenuClose]);

  const handleDelete = useCallback(() => {
    if (menuMarket) {
      setMarketToDelete(menuMarket);
      setDeleteDialogOpen(true);
      handleMenuClose();
    }
  }, [menuMarket, handleMenuClose]);

  const handleConfirmDelete = useCallback(async () => {
    if (!marketToDelete) return;
    
    setDeleteDialogOpen(false);
    try {
      await deleteMarket.mutateAsync(marketToDelete.id);
      await queryClient.invalidateQueries({ queryKey: ['markets'] });
      await queryClient.invalidateQueries({ queryKey: ['markets-analytics'] });
      setDeleteSuccessDialogOpen(true);
      setMarketToDelete(null);
      // Trigger refetch to show loading state
      await onRefresh();
    } catch (error) {
      console.error('Failed to delete market:', error);
      setMarketToDelete(null);
    }
  }, [deleteMarket, marketToDelete, queryClient, onRefresh]);

  const handleDeleteSuccess = useCallback(async () => {
    setDeleteSuccessDialogOpen(false);
  }, []);

  const handleToggle = useCallback(async () => {
    if (menuMarket) {
      try {
        await toggleMarket.mutateAsync(menuMarket.id);
        await queryClient.invalidateQueries({ queryKey: ['markets'] });
        await queryClient.invalidateQueries({ queryKey: ['markets-analytics'] });
        handleMenuClose();
        // Trigger refetch to show loading state
        await onRefresh();
      } catch (error) {
        console.error('Failed to toggle market:', error);
      }
    }
  }, [menuMarket, toggleMarket, queryClient, handleMenuClose, onRefresh]);

  // CSV Export hook
  const { handleExport, canExport } = useTableExport({
    data: markets,
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Market Name' },
      { key: 'displayName', label: 'Display Name' },
      { key: 'category', label: 'Category' },
      { key: 'sortOrder', label: 'Sort Order' },
      { key: 'isActive', label: 'Status', format: (value) => value ? 'Active' : 'Inactive' },
      { key: 'selections', label: 'Selections Count', format: (value) => String((value as unknown[])?.length || 0) },
    ],
    filename: `markets-${new Date().toISOString().split('T')[0]}`,
  });

  const hasActiveFilters = Boolean(filters.category || filters.isActive !== undefined || filters.search);

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ mb: 3, justifyContent: 'space-between' }}
        alignItems={{ xs: 'stretch', md: 'center' }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          sx={{ width: { xs: '100%', md: 'auto' } }}
        >
          <TextField
            placeholder="Search markets..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            size="small"
            sx={{ minWidth: { xs: '100%', sm: 250 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.isActive === undefined ? '' : filters.isActive ? 'active' : 'inactive'}
              label="Status"
              onChange={(e) => {
                const value = e.target.value;
                handleFilterChange('isActive', value === '' ? undefined : value === 'active');
              }}
              sx={{
                bgcolor: filters.isActive !== undefined ? 'action.selected' : 'transparent',
              }}
            >
              <SelectMenuItem value="">All</SelectMenuItem>
              <SelectMenuItem value="active">Active</SelectMenuItem>
              <SelectMenuItem value="inactive">Inactive</SelectMenuItem>
            </Select>
          </FormControl>

          {hasActiveFilters && (
            <Button size="small" onClick={handleClearFilters} sx={{ minWidth: 'auto' }}>
              Clear
            </Button>
          )}
        </Stack>

        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={!canExport}
          >
            Export CSV
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={onAddMarket}>
            Create Market
          </Button>
        </Stack>
      </Stack>

      <TableContainer
        component={Paper}
        sx={{
          width: '100%',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        <Table sx={{ minWidth: 600, tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" sx={{ width: 52 }} />
              <TableCell sx={{ width: '8%' }}>ID</TableCell>
              <TableCell sx={{ width: '30%' }}>Market Name</TableCell>
              <TableCell sx={{ width: '20%' }}>Category</TableCell>
              <TableCell align="center" sx={{ width: '15%' }}>Selections</TableCell>
              <TableCell sx={{ width: '15%' }}>Status</TableCell>
              <TableCell align="right" sx={{ width: '12%' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          {isLoading ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                  <TableLoadingState message="Loading markets..." />
                </TableCell>
              </TableRow>
            </TableBody>
          ) : error ? (
            <TableBody>
              <TableErrorState colSpan={7} message="Failed to load markets. Please try again." onRetry={onRefresh} />
            </TableBody>
          ) : markets.length === 0 ? (
            <TableBody>
              <TableEmptyState
                colSpan={7}
                message="No markets found"
                title="No Markets"
              />
            </TableBody>
          ) : (
            <TableBody>
              {markets.map((market) => (
                <MarketRow
                  key={market.id}
                  market={market}
                  isSelected={selectedIds.has(market.id)}
                  onSelect={handleSelectOne}
                  onMenuOpen={handleMenuOpen}
                />
              ))}
            </TableBody>
          )}
        </Table>
      </TableContainer>

      {pagination && (
        <PrevNextPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(page) => onFilterChange({ page })}
        />
      )}

      {/* Selected Market Profile */}
      {selectedMarket && <SelectedMarketProfile market={selectedMarket} />}

      {/* Actions Menu */}
      <Menu 
        anchorEl={anchorEl} 
        open={Boolean(anchorEl)} 
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleViewDetails}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleToggle}>
          <ListItemIcon>
            {menuMarket?.isActive ? (
              <ToggleOffIcon fontSize="small" color="warning" />
            ) : (
              <ToggleOnIcon fontSize="small" color="success" />
            )}
          </ListItemIcon>
          <ListItemText>
            {menuMarket?.isActive ? 'Deactivate' : 'Activate'}
          </ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        title="Delete Market"
        message={marketToDelete ? `Are you sure you want to delete the market "${marketToDelete.displayName}"? This action is irreversible.` : ''}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setMarketToDelete(null);
        }}
      />

      {/* Delete Success Dialog */}
      <SuccessDialog
        open={deleteSuccessDialogOpen}
        title="Market Deleted"
        message="The market has been successfully deleted from the system."
        onClose={handleDeleteSuccess}
      />
    </Box>
  );
});
