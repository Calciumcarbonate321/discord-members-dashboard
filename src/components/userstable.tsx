"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "~/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"

import { toast } from "~/hooks/use-toast"

interface Member {
  id: number
  name: string
  email: string
  department: string
  role: string
}

interface CsvMember {
  name: string
  email: string
  department: string
  role: string
}

const departmentMapping = {
  "Technical": "TECHNICAL",
  "Design": "DESIGN",
  "Management": "MANAGEMENT",
  "Marketing": "MARKETING"
} as const

const roleMapping = {
  "Member": "MEMBER",
  "Core Member": "CORE_MEMBER"
} as const

type DepartmentKey = keyof typeof departmentMapping
type RoleKey = keyof typeof roleMapping
type Department = typeof departmentMapping[DepartmentKey]
type Role = typeof roleMapping[RoleKey]

const departments = Object.keys(departmentMapping) as DepartmentKey[]
const roles = Object.keys(roleMapping) as RoleKey[]

// Type-safe CSV parsing function
const parseCsvLine = (headers: string[], line: string): CsvMember => {
  const values = line.split('\t')
  const member = headers.reduce<Partial<CsvMember>>((obj, header, index) => {
    const trimmedHeader = header.trim() as keyof CsvMember
    obj[trimmedHeader] = values[index]?.trim() ?? ""
    return obj
  }, {}) as CsvMember

  // Validate department and role
  if (!Object.values(departmentMapping).includes(member.department as Department)) {
    throw new Error(`Invalid department: ${member.department}`)
  }
  if (!Object.values(roleMapping).includes(member.role as Role)) {
    throw new Error(`Invalid role: ${member.role}`)
  }

  return member
}

export default function MemberTable() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newMember, setNewMember] = useState({ name: "", email: "", department: "", role: "" })
  const [modifyingMember, setModifyingMember] = useState<Member | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isModifyDialogOpen, setIsModifyDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingMemberId, setDeletingMemberId] = useState<number | null>(null)
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members')
      if (!response.ok) {
        throw new Error('Failed to fetch members')
      }
      const data = await response.json() as Member[]
      setMembers(data)
      setError(null)
    } catch (err) {
      setError('Failed to load members')
      console.error('Error fetching members:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    setDeletingMemberId(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (deletingMemberId === null) return

    try {
      const response = await fetch(`/api/members/${deletingMemberId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete member')
      }
      await fetchMembers()
      toast({
        title: "Member Deleted",
        description: "The member has been removed from the list.",
        duration: 2000,
      })
    } catch (err) {
      console.error('Error deleting member:', err)
      toast({
        title: "Error Deleting Member",
        description: "Failed to delete member. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setDeletingMemberId(null)
    }
  }

  const handleModify = (member: Member) => {
    setModifyingMember(member)
    setIsModifyDialogOpen(true)
  }

  const handleSubmitModification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modifyingMember) return

    try {
      const formattedMember = {
        id: modifyingMember.id,
        name: modifyingMember.name,
        email: modifyingMember.email,
        department: departmentMapping[modifyingMember.department as keyof typeof departmentMapping] || modifyingMember.department,
        role: roleMapping[modifyingMember.role as keyof typeof roleMapping] || modifyingMember.role
      }

      const response = await fetch('/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedMember),
      })

      if (!response.ok) {
        throw new Error('Failed to modify member')
      }

      await fetchMembers()
      setIsModifyDialogOpen(false)
      setModifyingMember(null)

      toast({
        title: "Member Modified Successfully",
        description: `${formattedMember.name}'s information has been updated.`,
        duration: 2000,
      })
    } catch (err) {
      console.error('Error modifying member:', err)
      toast({
        title: "Error Modifying Member",
        description: "Failed to modify member. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const formattedMember = {
        name: newMember.name,
        email: newMember.email,
        department: departmentMapping[newMember.department as keyof typeof departmentMapping],
        role: roleMapping[newMember.role as keyof typeof roleMapping]
      }

      const response = await fetch('/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedMember),
      })

      if (!response.ok) {
        throw new Error('Failed to add member')
      }

      await fetchMembers()
      setNewMember({ name: "", email: "", department: "", role: "" })
      setIsAddDialogOpen(false)

      toast({
        title: "Member Added Successfully",
        description: `${formattedMember.name} has been added to the list.`,
        duration: 2000,
      })
    } catch (err) {
      console.error('Error adding member:', err)
      toast({
        title: "Error Adding Member",
        description: "Failed to add new member. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewMember({ ...newMember, [name]: value })
  }

  const handleModifyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setModifyingMember(prev => prev ? { ...prev, [name]: value } : null)
  }

  const handleSelectChange = (name: string, value: string) => {
    setNewMember({ ...newMember, [name]: value })
  }

  const handleModifySelectChange = (name: string, value: string) => {
    setModifyingMember(prev => prev ? { ...prev, [name]: value } : null)
  }

  const getDisplayDepartment = (apiDepartment: string) => {
    return Object.entries(departmentMapping).find(([_, value]) => value === apiDepartment)?.[0] ?? apiDepartment
  }

  const getDisplayRole = (apiRole: string) => {
    return Object.entries(roleMapping).find(([_, value]) => value === apiRole)?.[0] ?? apiRole
  }

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const csvData = event.target?.result as string
      const lines = csvData.split('\n')
      const headers = lines[0]?.split('\t').map(header => header.trim()) ?? []

      // Validate headers
      const requiredHeaders: Array<keyof CsvMember> = ['name', 'email', 'department', 'role']
      const hasAllHeaders = requiredHeaders.every(header => headers.includes(header))
      
      if (!hasAllHeaders) {
        toast({
          title: "Invalid CSV Format",
          description: "CSV must contain headers: name, email, department, role",
          variant: "destructive",
        })
        return
      }

      try {
        const newMembers = lines
          .slice(1)
          .filter(line => line.trim())  // Skip empty lines
          .map(line => parseCsvLine(headers, line))

        const response = await fetch('/api/members/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newMembers),
        })

        if (!response.ok) {
          throw new Error('Failed to bulk upload members')
        }

        await fetchMembers()
        setIsBulkUploadDialogOpen(false)

        toast({
          title: "Bulk Upload Successful",
          description: `${newMembers.length} members have been added to the list.`,
          duration: 2000,
        })
      } catch (err) {
        console.error('Error bulk uploading members:', err)
        toast({
          title: "Error Bulk Uploading Members",
          description: err instanceof Error ? err.message : "Failed to bulk upload members. Please try again.",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
  }

  if (loading) {
    return <div className="container mx-auto py-10">Loading...</div>
  }

  if (error) {
    return <div className="container mx-auto py-10 text-red-500">{error}</div>
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Member List</h2>
        <div className="space-x-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add Member</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Member</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" value={newMember.name} onChange={handleInputChange} required />
                </div>
                <div>
                  <Label htmlFor="email">Email ID</Label>
                  <Input id="email" name="email" type="email" value={newMember.email} onChange={handleInputChange} required />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select name="department" value={newMember.department} onValueChange={(value) => handleSelectChange("department", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select name="role" value={newMember.role} onValueChange={(value) => handleSelectChange("role", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit">Add Member</Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={isBulkUploadDialogOpen} onOpenChange={setIsBulkUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>Bulk Upload</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Upload Members</DialogTitle>
                <DialogDescription>
                  Upload a CSV file with member details. The CSV should have headers: name, email, department, role.
                </DialogDescription>
              </DialogHeader>
              <Input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleBulkUpload}
              />
              <DialogFooter>
                <Button onClick={() => fileInputRef.current?.click()}>
                  Select File
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={isModifyDialogOpen} onOpenChange={setIsModifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modify Member</DialogTitle>
          </DialogHeader>
          {modifyingMember && (
            <form onSubmit={handleSubmitModification} className="space-y-4">
              <div>
                <Label htmlFor="modify-name">Name</Label>
                <Input id="modify-name" name="name" value={modifyingMember.name} onChange={handleModifyInputChange} required />
              </div>
              <div>
                <Label htmlFor="modify-email">Email ID</Label>
                <Input id="modify-email" name="email" type="email" value={modifyingMember.email} onChange={handleModifyInputChange} required />
              </div>
              <div>
                <Label htmlFor="modify-department">Department</Label>
                <Select name="department" value={getDisplayDepartment(modifyingMember.department)} onValueChange={(value) => handleModifySelectChange("department", value)} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="modify-role">Role</Label>
                <Select name="role" value={getDisplayRole(modifyingMember.role)} onValueChange={(value) => handleModifySelectChange("role", value)} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit">Save Changes</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Are you sure you want to delete this member? This action cannot be undone.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email ID</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>{member.name}</TableCell>
              <TableCell>{member.email}</TableCell>
              <TableCell>{getDisplayDepartment(member.department)}</TableCell>
              <TableCell>{getDisplayRole(member.role)}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleModify(member)}
                  >
                    Modify
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(member.id)}
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}