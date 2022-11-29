import CloseIcon from "@mui/icons-material/Close";
import InboxIcon from "@mui/icons-material/Inbox";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import MuiListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import { styled, withStyles } from "@mui/styles";
import { select } from "d3";
import React, { useState } from "react";
import { useDispatch } from "react-redux";

import { loadExample } from "../actions";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
	"& .MuiDialogContent-root": {
		background: "white",
		padding: theme.spacing(2)
	},
	"& .MuiDialogActions-root": {
		padding: theme.spacing(1)
	}
}));

const ListItem = withStyles({
	root: {
		"&$selected": {
			backgroundColor: "red",
			color: "white",
			"& .MuiListItemIcon-root": {
				color: "white"
			},
			borderRadius: "2px"
		},
		"&$selected:hover": {
			backgroundColor: "purple",
			color: "white",
			"& .MuiListItemIcon-root": {
				color: "white"
			},
			borderRadius: "2px"
		},
		"&:hover": {
			backgroundColor: "#04ACB5",
			color: "white",
			"& .MuiListItemIcon-root": {
				color: "white"
			},
			borderRadius: "2px"
		}
	},
	selected: {}
})(MuiListItem);

function BootstrapDialogTitle(props) {
	const { children, onClose, ...other } = props;

	return (
		<DialogTitle sx={{ m: 0, p: 2 }} {...other}>
			{children}
			{onClose ? (
				<IconButton
					aria-label="close"
					onClick={onClose}
					sx={{
						position: "absolute",
						right: 8,
						top: 8
					}}
				>
					<CloseIcon />
				</IconButton>
			) : null}
		</DialogTitle>
	);
}

export default function CustomizedDialogs() {
	const dispatch = useDispatch();
	const [open, setOpen] = useState(true);
	const [selectedExample, setSelectedExample] = useState("");

	const examples = { "sgemm-kernel-opt": "SGEMM Kernel Optimization" };

	const handleClickOpen = () => {
		setOpen(true);
	};
	const handleClose = () => {
		if (selectedExample != "") {
			dispatch(loadExample(selectedExample));
			setOpen(false);
		}
	};

	const handleListItemClick = (event, example) => {
		setSelectedExample(example);
	};

	return (
		<div>
			<BootstrapDialog
				onClose={handleClose}
				aria-labelledby="customized-dialog-title"
				open={open}
			>
				<BootstrapDialogTitle
					id="customized-dialog-title"
					onClose={handleClose}
				>
					Select an Example Profile.
				</BootstrapDialogTitle>
				<DialogContent dividers>
					<Typography gutterBottom></Typography>
					<List>
						{Object.entries(examples).map((example, idx) => (
							<ListItem
								key={idx}
								button
								disablePadding
								selected={selectedExample === example[0]}
								onClick={(event) =>
									handleListItemClick(event, example[0])
								}
							>
								<ListItemButton>
									<ListItemIcon>
										<InboxIcon />
									</ListItemIcon>
									<ListItemText primary={example[1]} />
								</ListItemButton>
							</ListItem>
						))}
					</List>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={handleClose}
						sx={{ background: "#04ACB5", color: "white" }}
					>
						Load
					</Button>
				</DialogActions>
			</BootstrapDialog>
		</div>
	);
}
