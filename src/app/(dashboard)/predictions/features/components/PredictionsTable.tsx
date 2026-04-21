/**
 * Predictions Table Component
 * Updated to match backend data structure
 */

'use client';

import { useState, useEffect, useCallback, memo } from 'react';
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
  Stack,
  InputAdornment,
  Select,
  FormControl,
  InputLabel,
  MenuItem as SelectMenuItem,
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
} from '@mui/icons-material';
import {
  TableErrorState,
  TableEmptyState,
  TableLoadingState,
} from '@/shared/components/TableStates';
import { Prediction, PredictionsFilter, PredictionStatus } from '@/features/predictions';
import { PaginationMeta } from '@/shared/types/common.types';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { SelectedPredictionProfile } from './SelectedPredictionProfile';
import { useTableExport } from '@/shared/hooks/useTableExport';
import { PrevNextPagination } from '@/shared/components/PrevNextPagination';

interface PredictionsTableProps {
  predictions: Prediction[];
  pagination: PaginationMeta | null;
  isLoading: boolean;
  error: Error | null;
  filters: PredictionsFilter;
  onFilterChange: (filters: Partial<PredictionsFilter>) => void;
  onAddPrediction: () => void;
  onEditPrediction: (prediction: Prediction) => void;
  onDeletePrediction: (prediction: Prediction) => void;
  onRefresh: () => void;
  selectedPrediction?: Prediction | null;
  onPredictionSelect?: (prediction: Prediction | null) => void;
}

interface PredictionRowProps {
  prediction: Prediction;
  isSelected: boolean;
  onSelect: (predictionId: number, prediction: Prediction) => void;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, prediction: Prediction) => void;
  formatDate: (dateString: string) => string;
  getStatusColor: (status: string) => 'default' | 'primary' | 'success' | 'warning' | 'error';
}

const PredictionRow = memo(function PredictionRow({
  prediction,
  isSelected,
  onSelect,
  onMenuOpen,
  formatDate,
  getStatusColor,
}: PredictionRowProps) {
  return (
    <TableRow
      hover
      onClick={() => onSelect(prediction.id, prediction)}
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
          onChange={() => onSelect(prediction.id, prediction)}
        />
      </TableCell>
      <TableCell>{prediction.id}</TableCell>
      <TableCell>{prediction.match}</TableCell>
      <TableCell>{prediction.picksCount}</TableCell>
      <TableCell>{prediction.accuracy}%</TableCell>
      <TableCell>{formatDate(prediction.datePostedUtc)}</TableCell>
      <TableCell>
        <Chip
          label={prediction.status.charAt(0).toUpperCase() + prediction.status.slice(1)}
          size="small"
          color={getStatusColor(prediction.status)}
        />
      </TableCell>
      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
        <IconButton size="small" onClick={(e) => onMenuOpen(e, prediction)}>
          <MoreVertIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );
});

export const PredictionsTable = memo(function PredictionsTable({
  predictions,
  pagination,
  isLoading,
  error,
  filters,
  onFilterChange,
  onAddPrediction,
  onEditPrediction,
  onDeletePrediction,
  onRefresh,
  selectedPrediction,
  onPredictionSelect,
}: PredictionsTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState(filters.search || '');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Menu state (actions dropdown)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuPrediction, setMenuPrediction] = useState<Prediction | null>(null);
  
  // Debounce search input
  const debouncedSearch = useDebounce(search, 300);
  
  // Sync selectedIds with selectedPrediction (single-select)
  useEffect(() => {
    if (selectedPrediction) {
      setSelectedIds(new Set([selectedPrediction.id]));
    } else {
      setSelectedIds(new Set());
    }
  }, [selectedPrediction]);
  
  // Update filters when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFilterChange({ search: debouncedSearch || undefined, page: 1 });
    }
  }, [debouncedSearch, filters.search, onFilterChange]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleSelectOne = useCallback((predictionId: number, prediction: Prediction) => {
    // Single-select: if clicking the same item, deselect it; otherwise select the new one
    if (selectedPrediction?.id === predictionId) {
      // Deselect if clicking the already selected item
      setSelectedIds(new Set());
      setTimeout(() => onPredictionSelect?.(null), 0);
    } else {
      // Select the new item (only one at a time)
      setSelectedIds(new Set([predictionId]));
      setTimeout(() => onPredictionSelect?.(prediction), 0);
    }
  }, [selectedPrediction, onPredictionSelect]);

  const getStatusColor = useCallback((status: string): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'scheduled':
        return 'primary';
      case 'active':
        return 'success';
      case 'expired':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  }, []);

  const handleFilterChange = useCallback((key: keyof PredictionsFilter, value: string | undefined) => {
    onFilterChange({ [key]: value || undefined, page: 1 });
  }, [onFilterChange]);

  const handleClearFilters = useCallback(() => {
    setSearch('');
    onFilterChange({ search: undefined, status: undefined, page: 1 });
  }, [onFilterChange]);

  // CSV Export hook
  const { handleExport, canExport } = useTableExport({
    data: predictions,
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'match', label: 'Match' },
      { key: 'picksCount', label: 'Picks Count' },
      { key: 'accuracy', label: 'Accuracy', format: (value) => `${value}%` },
      { key: 'datePostedUtc', label: 'Date Posted', format: (value) => formatDate(String(value)) },
      { key: 'status', label: 'Status', format: (value) => String(value).charAt(0).toUpperCase() + String(value).slice(1) },
    ],
    filename: `predictions-${new Date().toISOString().split('T')[0]}`,
  });

  const hasActiveFilters = Boolean(filters.status || filters.search);

  const statusOptions: PredictionStatus[] = ['scheduled', 'active', 'expired', 'cancelled'];

  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, prediction: Prediction) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuPrediction(prediction);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setMenuPrediction(null);
  }, []);

  const handleMenuViewDetails = useCallback(() => {
    if (!menuPrediction) return;
    router.push(`/predictions/${menuPrediction.id}`);
    handleMenuClose();
  }, [menuPrediction, router, handleMenuClose]);

  const handleMenuEdit = useCallback(() => {
    if (!menuPrediction) return;
    onEditPrediction(menuPrediction);
    handleMenuClose();
  }, [menuPrediction, onEditPrediction, handleMenuClose]);

  const handleMenuDelete = useCallback(() => {
    if (!menuPrediction) return;
    onDeletePrediction(menuPrediction);
    handleMenuClose();
  }, [menuPrediction, onDeletePrediction, handleMenuClose]);

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ mb: 3, justifyContent: 'space-between' }}
        alignItems={{ xs: 'stretch', md: 'center' }}
      >
        {/* Left side: Search and Filters */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          sx={{ width: { xs: '100%', md: 'auto' } }}
        >
          <TextField
            placeholder="Search predictions..."
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
              value={filters.status || ''}
              label="Status"
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <SelectMenuItem value="">All</SelectMenuItem>
              {statusOptions.map((status) => (
                <SelectMenuItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectMenuItem>
              ))}
            </Select>
          </FormControl>

          {hasActiveFilters && (
            <Button size="small" onClick={handleClearFilters} sx={{ minWidth: 'auto' }}>
              Clear
            </Button>
          )}
        </Stack>

        {/* Right side: Action buttons */}
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={!canExport}
          >
            Export CSV
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={onAddPrediction}>
            Add Prediction
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
        <Table sx={{ minWidth: 900 }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                {/* Single-select: no select all checkbox */}
              </TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Match</TableCell>
              <TableCell>Picks Count</TableCell>
              <TableCell>Accuracy</TableCell>
              <TableCell>Date Posted</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                  <TableLoadingState message="Loading predictions..." />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableErrorState colSpan={8} message="Failed to load predictions. Please try again." onRetry={onRefresh} />
            ) : predictions.length === 0 ? (
              <TableEmptyState
                colSpan={8}
                message="No predictions found"
                title="No Predictions"
              />
            ) : (
              predictions.map((prediction) => (
                <PredictionRow
                  key={prediction.id}
                  prediction={prediction}
                  isSelected={selectedIds.has(prediction.id)}
                  onSelect={handleSelectOne}
                  onMenuOpen={handleMenuOpen}
                  formatDate={formatDate}
                  getStatusColor={getStatusColor}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {pagination && (
        <PrevNextPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(page) => onFilterChange({ page })}
        />
      )}

      {/* Selected Prediction Profile */}
      {selectedPrediction && <SelectedPredictionProfile prediction={selectedPrediction} />}

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleMenuViewDetails}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
});
