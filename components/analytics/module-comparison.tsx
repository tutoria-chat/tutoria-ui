import React, { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GitCompare, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import type { Module, ModuleComparisonResponseDto, AnalyticsFilterDto } from '@/lib/types';

interface ModuleComparisonProps {
  availableModules: Module[];
  selectedUniversityId?: number;
  dateRange?: DateRange;
  translations: {
    title: string;
    description: string;
    show: string;
    hide: string;
    selectModules: string;
    modulesSelected: string;
    searchModules: string;
    noModulesFound: string;
    selectAtLeastTwo: string;
    maxModulesError: string;
    maxModulesDescription: string;
    loadError: string;
    moduleName: string;
    messages: string;
    students: string;
    tokens: string;
    cost: string;
    avgResponseTime: string;
    chartMessages: string;
    chartStudents: string;
    chartCostUSD: string;
  };
}

export function ModuleComparison({
  availableModules,
  selectedUniversityId,
  dateRange,
  translations: t
}: ModuleComparisonProps) {
  const [showComparison, setShowComparison] = useState(false);
  const [selectedModuleIds, setSelectedModuleIds] = useState<number[]>([]);
  const [moduleComparison, setModuleComparison] = useState<ModuleComparisonResponseDto | null>(null);
  const [moduleComboOpen, setModuleComboOpen] = useState(false);

  const loadModuleComparison = useCallback(async () => {
    if (selectedModuleIds.length < 2) return;

    try {
      const filters: Omit<AnalyticsFilterDto, 'moduleId'> = {
        ...(selectedUniversityId && { universityId: selectedUniversityId }),
        ...(dateRange?.from && { startDate: format(dateRange.from, 'yyyy-MM-dd') }),
        ...(dateRange?.to && { endDate: format(dateRange.to, 'yyyy-MM-dd') }),
      };

      const comparisonData = await apiClient.getAnalyticsModuleComparison(selectedModuleIds, filters);
      setModuleComparison(comparisonData);
    } catch (error) {
      console.error('Error loading module comparison:', error);
      toast.error(t.loadError);
    }
  }, [selectedModuleIds, selectedUniversityId, dateRange, t.loadError]);

  useEffect(() => {
    if (selectedModuleIds.length >= 2) {
      loadModuleComparison();
    }
  }, [selectedModuleIds, dateRange, loadModuleComparison]);

  const toggleModuleSelection = (moduleId: number) => {
    setSelectedModuleIds(prev => {
      if (prev.includes(moduleId)) {
        return prev.filter(id => id !== moduleId);
      }

      if (prev.length >= 10) {
        toast.error(t.maxModulesError, {
          description: t.maxModulesDescription
        });
        return prev;
      }

      return [...prev, moduleId];
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t.title}</CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowComparison(!showComparison)}
          >
            <GitCompare className="mr-2 h-4 w-4" />
            {showComparison ? t.hide : t.show}
          </Button>
        </div>
      </CardHeader>
      {showComparison && (
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {t.selectModules}
            </p>
            <Popover open={moduleComboOpen} onOpenChange={setModuleComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={moduleComboOpen}
                  className="w-full justify-between"
                >
                  {selectedModuleIds.length > 0
                    ? `${selectedModuleIds.length} ${t.modulesSelected}`
                    : t.selectModules}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder={t.searchModules} />
                  <CommandList>
                    <CommandEmpty>{t.noModulesFound}</CommandEmpty>
                    <CommandGroup>
                      {availableModules.map((module) => (
                        <CommandItem
                          key={module.id}
                          value={module.name}
                          onSelect={() => {
                            toggleModuleSelection(module.id);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              selectedModuleIds.includes(module.id) ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <div className="flex-1">
                            <p className="font-medium">{module.name}</p>
                            {module.code && (
                              <p className="text-xs text-muted-foreground">{module.code}</p>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {selectedModuleIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedModuleIds.map((id) => {
                  const module = availableModules.find((m) => m.id === id);
                  if (!module) return null;
                  return (
                    <Badge key={id} variant="secondary" className="px-2 py-1">
                      {module.name}
                      <button
                        onClick={() => toggleModuleSelection(id)}
                        className="ml-2 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {selectedModuleIds.length < 2 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t.selectAtLeastTwo}
            </p>
          )}

          {moduleComparison && moduleComparison.modules.length > 0 && (
            <div className="mt-6">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={moduleComparison.modules}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="moduleName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalMessages" fill="#3b82f6" name={t.chartMessages} />
                  <Bar dataKey="uniqueStudents" fill="#10b981" name={t.chartStudents} />
                  <Bar dataKey="estimatedCostUSD" fill="#f59e0b" name={t.chartCostUSD} />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">{t.moduleName}</th>
                      <th className="text-right p-2">{t.messages}</th>
                      <th className="text-right p-2">{t.students}</th>
                      <th className="text-right p-2">{t.tokens}</th>
                      <th className="text-right p-2">{t.cost}</th>
                      <th className="text-right p-2">{t.avgResponseTime}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {moduleComparison.modules.map((module) => (
                      <tr key={module.moduleId} className="border-b">
                        <td className="p-2 font-medium">{module.moduleName || 'N/A'}</td>
                        <td className="text-right p-2">{(module.totalMessages ?? 0).toLocaleString()}</td>
                        <td className="text-right p-2">{module.uniqueStudents ?? 0}</td>
                        <td className="text-right p-2">{(module.totalTokens ?? 0).toLocaleString()}</td>
                        <td className="text-right p-2">${(module.estimatedCostUSD ?? 0).toFixed(2)}</td>
                        <td className="text-right p-2">{((module.averageResponseTimeMs ?? 0) / 1000).toFixed(2)}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
