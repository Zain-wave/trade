"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Camera,
  CheckCircle2,
  AlertCircle,
  Upload,
  FileText,
  Calendar,
  TrendingUp,
  ArrowRightLeft,
} from "lucide-react"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"

export function ProfileContent() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") || "profile"

  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [kycDocuments, setKycDocuments] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState(initialTab)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    dateOfBirth: "",
  })

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    emailNotifications: true,
    pushNotifications: true,
    marketAlerts: true,
    transactionAlerts: true,
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswords, setShowPasswords] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
      setProfile(profileData)

      if (profileData) {
        setFormData({
          firstName: profileData.first_name || "",
          lastName: profileData.last_name || "",
          phone: profileData.phone || "",
          address: profileData.address || "",
          city: profileData.city || "",
          country: profileData.country || "",
          dateOfBirth: profileData.date_of_birth || "",
        })
      }

      const { data: kycData } = await supabase
        .from("kyc_documents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      setKycDocuments(kycData || [])

      setLoading(false)
    }
    fetchData()
  }, [supabase])

  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        date_of_birth: formData.dateOfBirth || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (!error) {
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }
    setSaving(false)
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Passwords do not match")
      return
    }

    const { error } = await supabase.auth.updateUser({
      password: passwordData.newPassword,
    })

    if (!error) {
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      alert("Password updated successfully")
    } else {
      alert("Failed to update password")
    }
  }

  const getInitials = () => {
    if (formData.firstName && formData.lastName) {
      return `${formData.firstName[0]}${formData.lastName[0]}`.toUpperCase()
    }
    return user?.email?.[0]?.toUpperCase() || "U"
  }

  const getKycStatus = () => {
    if (profile?.kyc_status === "verified") return "verified"
    if (profile?.kyc_status === "pending") return "pending"
    return "unverified"
  }

  const getKycBadge = () => {
    const status = getKycStatus()
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Verified
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary">
            <AlertCircle className="mr-1 h-3 w-3" />
            Pending Review
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="mr-1 h-3 w-3" />
            Unverified
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              variant="secondary"
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {formData.firstName
                ? `${formData.firstName} ${formData.lastName}`
                : "Your Profile"}
            </h2>
            <p className="text-muted-foreground">{user?.email}</p>
            <div className="mt-2">{getKycBadge()}</div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="kyc">KYC</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details here</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {saveSuccess && (
                <Alert className="border-green-500/50 bg-green-500/10">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertTitle>Profile Updated</AlertTitle>
                  <AlertDescription>
                    Your profile information has been saved successfully.
                  </AlertDescription>
                </Alert>
              )}

              <FieldGroup>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel>First Name</FieldLabel>
                    <Input
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      placeholder="John"
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Last Name</FieldLabel>
                    <Input
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      placeholder="Doe"
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel>Email Address</FieldLabel>
                  <Input value={user?.email || ""} disabled className="bg-muted" />
                  <p className="text-sm text-muted-foreground">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </Field>

                <Field>
                  <FieldLabel>Phone Number</FieldLabel>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                </Field>

                <Field>
                  <FieldLabel>Date of Birth</FieldLabel>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      setFormData({ ...formData, dateOfBirth: e.target.value })
                    }
                  />
                </Field>

                <Separator />

                <Field>
                  <FieldLabel>Address</FieldLabel>
                  <Input
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="123 Main St"
                  />
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel>City</FieldLabel>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="New York"
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Country</FieldLabel>
                    <Select
                      value={formData.country}
                      onValueChange={(value) => setFormData({ ...formData, country: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="UK">United Kingdom</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="AU">Australia</SelectItem>
                        <SelectItem value="DE">Germany</SelectItem>
                        <SelectItem value="FR">France</SelectItem>
                        <SelectItem value="JP">Japan</SelectItem>
                        <SelectItem value="SG">Singapore</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </FieldGroup>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel>Current Password</FieldLabel>
                  <div className="relative">
                    <Input
                      type={showPasswords ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value,
                        })
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowPasswords(!showPasswords)}
                    >
                      {showPasswords ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </Field>

                <Field>
                  <FieldLabel>New Password</FieldLabel>
                  <Input
                    type={showPasswords ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                  />
                </Field>

                <Field>
                  <FieldLabel>Confirm New Password</FieldLabel>
                  <Input
                    type={showPasswords ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                  />
                </Field>
              </FieldGroup>

              <div className="flex justify-end">
                <Button
                  onClick={handleChangePassword}
                  disabled={
                    !passwordData.currentPassword ||
                    !passwordData.newPassword ||
                    !passwordData.confirmPassword
                  }
                >
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      Secure your account with 2FA
                    </p>
                  </div>
                </div>
                <Switch
                  checked={securitySettings.twoFactorEnabled}
                  onCheckedChange={(checked) =>
                    setSecuritySettings({ ...securitySettings, twoFactorEnabled: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Manage your active login sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Current Session</p>
                    <p className="text-sm text-muted-foreground">
                      Chrome on Windows • {new Date().toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-green-500">
                    Active
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kyc">
          <Card>
            <CardHeader>
              <CardTitle>Identity Verification (KYC)</CardTitle>
              <CardDescription>
                Complete verification to unlock full platform features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Verification Status</p>
                    <p className="text-sm text-muted-foreground">
                      {getKycStatus() === "verified"
                        ? "Your identity has been verified"
                        : getKycStatus() === "pending"
                        ? "Your documents are being reviewed"
                        : "Complete verification to access all features"}
                    </p>
                  </div>
                  {getKycBadge()}
                </div>
              </div>

              {getKycStatus() !== "verified" && (
                <div className="space-y-4">
                  <h4 className="font-medium">Required Documents</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-dashed p-6 text-center">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 font-medium">Government ID</p>
                      <p className="text-sm text-muted-foreground">
                        Passport, Driver&apos;s License, or National ID
                      </p>
                      <Button variant="outline" className="mt-4">
                        Upload Document
                      </Button>
                    </div>
                    <div className="rounded-lg border border-dashed p-6 text-center">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 font-medium">Proof of Address</p>
                      <p className="text-sm text-muted-foreground">
                        Utility bill or bank statement (last 3 months)
                      </p>
                      <Button variant="outline" className="mt-4">
                        Upload Document
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {kycDocuments.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">Submitted Documents</h4>
                  <div className="space-y-3">
                    {kycDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium capitalize">
                              {doc.document_type.replace("_", " ")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Submitted {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            doc.status === "approved"
                              ? "default"
                              : doc.status === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {doc.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive updates via email
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={securitySettings.emailNotifications}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({
                        ...securitySettings,
                        emailNotifications: checked,
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive push notifications on your device
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={securitySettings.pushNotifications}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({
                        ...securitySettings,
                        pushNotifications: checked,
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Market Alerts</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified about significant market movements
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={securitySettings.marketAlerts}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({ ...securitySettings, marketAlerts: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Transaction Alerts</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified when transactions are completed
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={securitySettings.transactionAlerts}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({
                        ...securitySettings,
                        transactionAlerts: checked,
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible account actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
                <div>
                  <p className="font-medium">Delete Account</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button variant="destructive">Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}