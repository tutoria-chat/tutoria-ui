'use client';

import React, { useState } from 'react';
import { Search, Filter, Building2, BookOpen, Users, GraduationCap, FileText, Key, Clock, Eye } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectItem } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SuperAdminOnly } from '@/components/auth/role-guard';
import type { BreadcrumbItem } from '@/lib/types';

// Mock search results
const mockSearchResults = {
  universities: [
    { id: 1, name: 'University of Technology', description: 'Leading tech university', type: 'university', courses: 45 },
    { id: 2, name: 'State University', description: 'Public comprehensive university', type: 'university', courses: 67 }
  ],
  courses: [
    { id: 1, name: 'Computer Science Fundamentals', university: 'University of Technology', type: 'course', students: 89 },
    { id: 2, name: 'Web Development Bootcamp', university: 'University of Technology', type: 'course', students: 67 },
    { id: 3, name: 'Data Science and Analytics', university: 'State University', type: 'course', students: 123 }
  ],
  modules: [
    { id: 1, name: 'Introduction to Programming', course: 'Computer Science Fundamentals', type: 'module', files: 8 },
    { id: 2, name: 'Data Structures', course: 'Computer Science Fundamentals', type: 'module', files: 12 },
    { id: 3, name: 'Machine Learning Basics', course: 'Data Science and Analytics', type: 'module', files: 22 }
  ],
  professors: [
    { id: 1, name: 'Dr. John Smith', email: 'john.smith@university.edu', university: 'University of Technology', type: 'professor', role: 'Admin Professor' },
    { id: 2, name: 'Prof. Sarah Johnson', email: 'sarah.johnson@university.edu', university: 'University of Technology', type: 'professor', role: 'Regular Professor' },
    { id: 3, name: 'Dr. Michael Davis', email: 'michael.davis@state.edu', university: 'State University', type: 'professor', role: 'Admin Professor' }
  ],
  students: [
    { id: 1, name: 'Alice Wilson', email: 'alice.wilson@student.edu', university: 'University of Technology', type: 'student', courses: 3 },
    { id: 2, name: 'Bob Chen', email: 'bob.chen@student.edu', university: 'State University', type: 'student', courses: 2 }
  ],
  files: [
    { id: 1, name: 'Introduction_to_Python.pdf', module: 'Introduction to Programming', type: 'file', size: '2.4 MB' },
    { id: 2, name: 'Data_Structures_Slides.pptx', module: 'Data Structures', type: 'file', size: '8.7 MB' },
    { id: 3, name: 'ML_Dataset.csv', module: 'Machine Learning Basics', type: 'file', size: '156 MB' }
  ]
};

export default function GlobalSearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<string>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchTime, setSearchTime] = useState<number>(0);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Administration', href: '/admin' },
    { label: 'Global Search', isCurrentPage: true }
  ];

  const searchTypes = [
    { value: 'all', label: 'All Content' },
    { value: 'universities', label: 'Universities' },
    { value: 'courses', label: 'Courses' },
    { value: 'modules', label: 'Modules' },
    { value: 'professors', label: 'Professors' },
    { value: 'students', label: 'Students' },
    { value: 'files', label: 'Files' }
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const startTime = Date.now();
    
    // Simular busca na API
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const endTime = Date.now();
    setSearchTime(endTime - startTime);
    
    // Filtrar resultados mock baseado no tipo de busca
    let results: any = {};
    
    if (searchType === 'all') {
      results = mockSearchResults;
    } else {
      results = { [searchType]: mockSearchResults[searchType as keyof typeof mockSearchResults] || [] };
    }
    
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'university': return <Building2 className="h-4 w-4" />;
      case 'course': return <BookOpen className="h-4 w-4" />;
      case 'module': return <FileText className="h-4 w-4" />;
      case 'professor': return <Users className="h-4 w-4" />;
      case 'student': return <GraduationCap className="h-4 w-4" />;
      case 'file': return <FileText className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'university': return 'bg-blue-100 text-blue-700';
      case 'course': return 'bg-green-100 text-green-700';
      case 'module': return 'bg-purple-100 text-purple-700';
      case 'professor': return 'bg-amber-100 text-amber-700';
      case 'student': return 'bg-pink-100 text-pink-700';
      case 'file': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTotalResults = () => {
    if (!searchResults) return 0;
    return Object.values(searchResults).reduce((total: number, items: any) => total + (Array.isArray(items) ? items.length : 0), 0);
  };

  return (
    <SuperAdminOnly>
      <div className="space-y-6">
        <PageHeader
          title="Global Search"
          description="Search across all universities, courses, modules, users, and files"
          breadcrumbs={breadcrumbs}
        />

        {/* Search Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="mr-2 h-5 w-5" />
              Search System-Wide Content
            </CardTitle>
            <CardDescription>
              Search for any content across all universities and institutions in the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Search for universities, courses, modules, users, files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="text-base"
                />
              </div>
              <div className="w-48">
                <Select
                  value={searchType}
                  onValueChange={setSearchType}
                >
                  {searchTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={isSearching || !searchQuery.trim()}
              >
                {isSearching ? (
                  <>Searching...</>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </div>

            {searchResults && (
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>
                    Found <strong>{getTotalResults()}</strong> results for "<strong>{searchQuery}</strong>"
                  </span>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{searchTime}ms</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSearchResults(null);
                    setSearchQuery('');
                  }}
                >
                  Clear Results
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchResults && (
          <div className="space-y-6">
            {/* Universities */}
            {searchResults.universities && searchResults.universities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building2 className="mr-2 h-5 w-5 text-blue-500" />
                    Universities ({searchResults.universities.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {searchResults.universities.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                            {getTypeIcon(item.type)}
                          </div>
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="secondary">{item.courses} courses</Badge>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Courses */}
            {searchResults.courses && searchResults.courses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="mr-2 h-5 w-5 text-green-500" />
                    Courses ({searchResults.courses.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {searchResults.courses.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                            {getTypeIcon(item.type)}
                          </div>
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">{item.university}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="secondary">{item.students} students</Badge>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Modules */}
            {searchResults.modules && searchResults.modules.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-purple-500" />
                    Modules ({searchResults.modules.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {searchResults.modules.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                            {getTypeIcon(item.type)}
                          </div>
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">{item.course}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="secondary">{item.files} files</Badge>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Professors */}
            {searchResults.professors && searchResults.professors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5 text-amber-500" />
                    Professors ({searchResults.professors.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {searchResults.professors.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                            {getTypeIcon(item.type)}
                          </div>
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">{item.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="secondary">{item.university}</Badge>
                              <Badge variant="outline">{item.role}</Badge>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Students */}
            {searchResults.students && searchResults.students.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <GraduationCap className="mr-2 h-5 w-5 text-pink-500" />
                    Students ({searchResults.students.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {searchResults.students.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                            {getTypeIcon(item.type)}
                          </div>
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">{item.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="secondary">{item.university}</Badge>
                              <Badge variant="outline">{item.courses} courses</Badge>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Files */}
            {searchResults.files && searchResults.files.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-gray-500" />
                    Files ({searchResults.files.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {searchResults.files.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                            {getTypeIcon(item.type)}
                          </div>
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">{item.module}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline">{item.size}</Badge>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty State */}
        {!searchResults && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Search className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Search System Content</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                  Enter a search query above to find universities, courses, modules, users, and files across the entire system.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </SuperAdminOnly>
  );
}