import type { IColumn } from "@fluentui/react";
import {
  PrimaryButton,
  TextField,
  Stack,
  Text,
  Separator,
  Spinner,
  SpinnerSize,
  MessageBar,
  MessageBarType,
  Persona,
  PersonaSize,
  DetailsList,
  SelectionMode,
  DetailsListLayoutMode,
  Label,
} from "@fluentui/react";
import "./App.css";
import { Office365UsersService } from "./generated";
import type { Office365UsersModel } from "./generated";
import { useState } from "react";

type GraphUser = Office365UsersModel.GraphUser_V1;
type User = Office365UsersModel.User;

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="field-row">
      <span className="field-label">{label}</span>
      <span className="field-value">{value}</span>
    </div>
  );
}

function ProfileCard({ title, user }: { title: string; user: GraphUser }) {
  const initials = (user.givenName?.[0] ?? "") + (user.surname?.[0] ?? "");
  return (
    <div className="card">
      <Text variant="large" block className="card-title">
        {title}
      </Text>
      <Persona
        text={user.displayName ?? "Unknown"}
        secondaryText={user.jobTitle ?? ""}
        tertiaryText={user.department ?? ""}
        size={PersonaSize.size72}
        imageInitials={initials || undefined}
        styles={{ root: { marginBottom: 16 } }}
      />
      <div className="card-fields">
        {user.mail && <Field label="Email" value={user.mail} />}
        {user.userPrincipalName && (
          <Field label="UPN" value={user.userPrincipalName} />
        )}
        {user.mobilePhone && <Field label="Mobile" value={user.mobilePhone} />}
        {user.officeLocation && (
          <Field label="Office" value={user.officeLocation} />
        )}
        {user.city && <Field label="City" value={user.city} />}
        {user.country && <Field label="Country" value={user.country} />}
        {user.preferredLanguage && (
          <Field label="Language" value={user.preferredLanguage} />
        )}
        {user.userType && <Field label="User Type" value={user.userType} />}
        <Field
          label="Account Enabled"
          value={user.accountEnabled ? "Yes" : "No"}
        />
        {user.id && <Field label="User ID" value={user.id} />}
      </div>
    </div>
  );
}

const searchColumns: IColumn[] = [
  {
    key: "displayName",
    name: "Display Name",
    fieldName: "DisplayName",
    minWidth: 120,
    maxWidth: 180,
    isResizable: true,
  },
  {
    key: "mail",
    name: "Email",
    fieldName: "Mail",
    minWidth: 180,
    maxWidth: 250,
    isResizable: true,
  },
];

function App() {
  // ── 1. My Profile ──────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<GraphUser | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // ── 2. Manager ─────────────────────────────────────────────────────────────
  const [manager, setManager] = useState<GraphUser | null>(null);
  const [managerLoading, setManagerLoading] = useState(false);
  const [managerError, setManagerError] = useState<string | null>(null);

  // ── 3. Search Users ────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchDone, setSearchDone] = useState(false);

  const fetchMyProfile = async () => {
    setProfileLoading(true);
    setProfileError(null);
    setProfile(null);
    try {
      const result = await Office365UsersService.MyProfile_V2();
      if (result.data) {
        setProfile(result.data);
      } else {
        setProfileError("No profile data returned.");
      }
    } catch {
      setProfileError(
        "Failed to fetch profile. Check the connector connection.",
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchManager = async () => {
    if (!profile?.id) return;
    setManagerLoading(true);
    setManagerError(null);
    setManager(null);
    try {
      const result = await Office365UsersService.Manager_V2(profile.id);
      if (result.data) {
        setManager(result.data);
      } else {
        setManagerError("No manager found for this user.");
      }
    } catch {
      setManagerError(
        "Failed to fetch manager. This user may not have a manager assigned.",
      );
    } finally {
      setManagerLoading(false);
    }
  };

  const searchUsers = async () => {
    setSearchLoading(true);
    setSearchError(null);
    setSearchResults([]);
    setSearchDone(false);
    try {
      const result = await Office365UsersService.SearchUserV2(
        searchQuery.trim() || undefined,
      );
      const users = result.data?.value ?? [];
      setSearchResults(users);
    } catch {
      setSearchError("Failed to search users.");
    } finally {
      setSearchLoading(false);
      setSearchDone(true);
    }
  };

  return (
    <div className="app">
      <div className="page-header">
        <h1 className="page-title">Office 365 Users Service</h1>
        <p className="page-subtitle">
          Demonstrating <strong>MyProfile_V2</strong>,{" "}
          <strong>Manager_V2</strong>, and <strong>SearchUserV2</strong> via the
          Power Apps Office 365 Users connector.
        </p>
      </div>

      {/* ── Section 1: My Profile ── */}
      <section className="section">
        <div className="section-header">
          <span className="section-badge">1</span>
          <div>
            <Text variant="xLarge" block>
              My Profile : <code>MyProfile_V2()</code>
            </Text>
            <Text variant="small" className="section-desc">
              Retrieves the signed-in user's full profile from Microsoft Graph.
            </Text>
          </div>
        </div>
        <PrimaryButton
          text="Get My Profile"
          onClick={fetchMyProfile}
          disabled={profileLoading}
        />
        {profileLoading && (
          <Spinner size={SpinnerSize.medium} label="Loading profile..." />
        )}
        {profileError && (
          <MessageBar messageBarType={MessageBarType.error}>
            {profileError}
          </MessageBar>
        )}
        {profile && <ProfileCard title="My Profile" user={profile} />}
      </section>

      <Separator />

      {/* ── Section 2: Manager ── */}
      <section className="section">
        <div className="section-header">
          <span className="section-badge">2</span>
          <div>
            <Text variant="xLarge" block>
              My Manager : <code>Manager_V2(id)</code>
            </Text>
            <Text variant="small" className="section-desc">
              Retrieves the manager of the current user using their ID fetched
              above.
            </Text>
          </div>
        </div>
        <Stack tokens={{ childrenGap: 8 }}>
          <PrimaryButton
            text="Get My Manager"
            onClick={fetchManager}
            disabled={managerLoading || !profile?.id}
            title={
              !profile?.id
                ? "Fetch your profile first to get the user ID"
                : undefined
            }
          />
          {!profile?.id && (
            <Text variant="small" className="hint-text">
              ⚠ Fetch your profile first to enable this.
            </Text>
          )}
        </Stack>
        {managerLoading && (
          <Spinner size={SpinnerSize.medium} label="Loading manager..." />
        )}
        {managerError && (
          <MessageBar messageBarType={MessageBarType.error}>
            {managerError}
          </MessageBar>
        )}
        {manager && <ProfileCard title="Manager Profile" user={manager} />}
      </section>

      <Separator />

      {/* ── Section 3: Search Users ── */}
      <section className="section">
        <div className="section-header">
          <span className="section-badge">3</span>
          <div>
            <Text variant="xLarge" block>
              Search Users : <code>SearchUserV2(searchTerm)</code>
            </Text>
            <Text variant="small" className="section-desc">
              Searches users in the organisation by display name or email.
            </Text>
          </div>
        </div>
        <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign="end" wrap>
          <TextField
            label="Search Term"
            placeholder="e.g. Room, John, admin…"
            value={searchQuery}
            onChange={(_, v) => setSearchQuery(v ?? "")}
            onKeyDown={(e) => e.key === "Enter" && searchUsers()}
            styles={{ root: { width: 300 } }}
            autoComplete="off"
          />
          <PrimaryButton
            text="Search"
            onClick={searchUsers}
            disabled={searchLoading}
          />
        </Stack>
        {searchLoading && (
          <Spinner size={SpinnerSize.medium} label="Searching users..." />
        )}
        {searchError && (
          <MessageBar messageBarType={MessageBarType.error}>
            {searchError}
          </MessageBar>
        )}
        {searchDone && !searchLoading && searchResults.length === 0 && (
          <MessageBar messageBarType={MessageBarType.info}>
            No users found{searchQuery ? ` for "${searchQuery}"` : ""}.
          </MessageBar>
        )}
        {searchResults.length > 0 && (
          <div className="search-results">
            <Label className="results-label">
              {searchResults.length} user(s) found
            </Label>
            <DetailsList
              items={searchResults}
              columns={searchColumns}
              selectionMode={SelectionMode.none}
              layoutMode={DetailsListLayoutMode.justified}
              isHeaderVisible
            />
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
