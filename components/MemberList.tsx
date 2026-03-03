import React from "react";

interface Member {
	_id: string;
	name: string;
	email: string;
}

interface MemberListProps {
	members: Member[];
}

const MemberList: React.FC<MemberListProps> = ({ members }) => {
	if (!members.length) return <p>No members found.</p>;
	return (
		<ul className="divide-y divide-gray-700">
			{members.map((member) => (
				<li key={member._id} className="py-2">
					<div className="font-medium">{member.name}</div>
					<div className="text-xs text-gray-400">{member.email}</div>
				</li>
			))}
		</ul>
	);
};

export default MemberList;
